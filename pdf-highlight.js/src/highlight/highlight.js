/**
 * Highlight manager library
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 * 
 * 
 */

'use strict';
var HIGHLIGHTDISABLED_CLASSNAME = "highlightDisabled";
var HIGHLIGHTENABLED_CLASSNAME = "highlightEnabled";

var HIGHLIGHT_CSSCLASSNAME = "highlighted";

var HIGHLIGHT_STORENAME = "highlight";

var HIGHLIGHTDIVNODE_PREFIX = "highlightNode";
var DIVNODE_PREFIX = "node";
var PAGECONTAINER_PREFIX = "pageContainer";

var SCHEMEFILENAME_PREFIX = "Scheme_";

var HighlightHistoryItem = {
	highlightItem : null,
	dehighlightItems : new Array()
};

var HighlightManager = {
	active : false,
	keyHandled : false,
	mouseHandled : false,
	container : null,
	store : null,
	view : null,
	history : new Array(),

	initialize : function highlightManagerInitialize(options) {

		this.active = options.active;
		this.container = options.container;
		this.view = options.view;
		this.container.addEventListener('keyup', this.keyup, false);
		this.container.addEventListener('keydown', this.keydown, false);
		this.container.addEventListener('mousedown', this.mouseDown, false);
		this.container.addEventListener('mouseup', this.mouseUp, false);
		/*
		 * Para dispositivos tactiles, pero hay que hacer pruebas
		 * this.container.addEventListener('touchstart', this.mouseDown, false);
		 * this.container.addEventListener('touchend', this.mouseUp, false);
		 */

	},

	load : function highlightManagerLoad(store) {
		this.store = store;
	},

	loadPage : function highlightManagerLoadPage(pageId) {
		var data = HighlightManager.get();
		for ( var element in data) {

			var nodeDef = data[element].split('~')[0];

			var elementId = nodeDef.split(':')[0];
			var elementOffset = nodeDef.split(':')[1];

			var elementPageId = PAGECONTAINER_PREFIX
					+ (parseInt(elementId.split(".")[0].replace(DIVNODE_PREFIX,
							"")) + 1);
			if (elementPageId == pageId) {

				var node = document.getElementById(elementId.split("-")[0]);

				if (node) {
					var startOffset = elementOffset.split("-")[0];
					var endOffset = elementOffset.split("-")[1];
					HighlightManager.highlight(node, elementId, startOffset,
							endOffset);
				}
			}
		}
	},

	get : function getData() {
		return HighlightManager.store ? HighlightManager.store.get(
				HIGHLIGHT_STORENAME, new Array()) : new Array();
	},

	set : function setData(data) {
		if (HighlightManager.store) {
			HighlightManager.store.set(HIGHLIGHT_STORENAME, data);
		}
	},

	toogleHighlight : function toogleHighlight(evt) {

		function addRule(s, l, c) {
			if (!s)
				return false;
			if (s.insertRule) {
				s.insertRule(l + "{" + c + "}", s.cssRules.length);
				return true;
			} else if (s.addRule) {
				return s.addRule(l, c) ? true : false;
			}
			return false;
		}
		this.active = !this.active;

		var ss = false;
		if (document.styleSheets)
			ss = document.styleSheets[0];
		if (ss.sheet)
			ss = ss.sheet;
		if (ss.styleSheet)
			ss = ss.styleSheet;

		if (this.active) {
			if (ss) {
				addRule(ss, '::selection', 'background:rgba(255, 190, 9, 0.4);');
			}

			this.highlightSelection();
		} else {
			if (ss.removeRule) {
				ss.removeRule(ss.cssRules.length - 1);
			}
		}

		var buttons = document
				.getElementsByClassName(this.active ? HIGHLIGHTDISABLED_CLASSNAME
						: HIGHLIGHTENABLED_CLASSNAME);

		for (var i = buttons.length - 1, n = 0; i >= n; --i) {

			buttons[i].className = buttons[i].className.replace(
					this.active ? HIGHLIGHTDISABLED_CLASSNAME
							: HIGHLIGHTENABLED_CLASSNAME,
					this.active ? HIGHLIGHTENABLED_CLASSNAME
							: HIGHLIGHTDISABLED_CLASSNAME);
		}

	},

	highlight : function highlightText(node, key, startOffset, endOffset) {
		if (HighlightManager.isLineNode(node)) {

			var pageId = node.id.split(".")[0].replace(DIVNODE_PREFIX, "");

			var newNode = PDFView.pages[pageId].textLayer.highlightLayer
					.appendChild(node.cloneNode());

			newNode.id = node.id.replace(DIVNODE_PREFIX,
					HIGHLIGHTDIVNODE_PREFIX);
			newNode.innerHTML = node.innerText.substring(0, startOffset)
					+ "<span id='" + key + "' class='" + HIGHLIGHT_CSSCLASSNAME
					+ "'>" + node.innerText.substring(startOffset, endOffset)
					+ "</span>" + node.innerText.substring(endOffset);
		}
	},

	// EXAMPLE : node6.175-5:12-20
	dehighlight : function dehighlightText(nodeId) {

		var pageId = nodeId.split(":")[0].split(".")[0].replace(DIVNODE_PREFIX,
				"");

		var nodeIdd = nodeId.split(":")[0].split("-")[0].replace(
				DIVNODE_PREFIX, HIGHLIGHTDIVNODE_PREFIX);

		if (document.getElementById(nodeIdd)) {

			PDFView.pages[pageId].textLayer.highlightLayer.removeChild(document
					.getElementById(nodeIdd));
		} else {

			console.log(nodeIdd + " no encontrado.");
		}
	},

	highlightNode : function highlightNode(nodeId, data) {

		var key = nodeId.split(":")[0];
		var nodeIdd = key.split("-")[0];
		var node = document.getElementById(nodeIdd);

		var elementOffset = nodeId.split(':')[1];
		var startOffset = elementOffset.split("-")[0];
		var endOffset = elementOffset.split("-")[1];

		var text = node.innerText.substring(startOffset, endOffset);

		HighlightManager.highlight(node, key, startOffset, endOffset);

		data.push(nodeId + "~" + text);
	},

	dehighlightNode : function dehighlightNode(nodeId, data) {
		HighlightManager.dehighlight(nodeId);
		var index = data.indexOf(nodeId);
		if (index > -1) {
			data.splice(index, 1);
		}
	},

	findNode : function findNode(node) {
		if (node) {
			if (HighlightManager.isLineNode(node)) {
				return node;
			} else if (node.parentElement) {
				return findNode(node.parentElement);
			} else {
				return node;
			}
		} else {
			return node;
		}
	},

	isLineNode : function isLineNode(node) {
		return (node && node.id && node.id.indexOf(DIVNODE_PREFIX) == 0);
	},

	highlightSelection : function highlightSelection() {

		function arrayContains(array, obj) {
			var i = array.length;
			while (i--) {
				if (array[i] === obj) {
					return true;
				}
			}
			return false;
		}

		function findNodesInArray(array, nodeId) {
			var i = array.length;
			var newArray;
			newArray = new Array();
			while (i--) {
				if (array[i].indexOf(nodeId) == 0) {
					newArray.push(array[i]);
				}
			}
			return newArray;
		}

		function highlightOneLine(node, startOffset, endOffset, data,
				historyCommand) {

			var dataAffected = findNodesInArray(data, node.id);
			var i;
			i = 0;
			var selectionsToRemove;
			selectionsToRemove = new Array();
			var breakSelection;
			breakSelection = false;
			while (i < dataAffected.length) {
				var offsetAffected = dataAffected[i].split(":")[1];
				var start = parseInt(offsetAffected.split("-")[0]);
				var end = parseInt(offsetAffected.split("-")[1]);
				var remove;
				remove = false;

				if (startOffset >= start && endOffset <= end) {
					// seleccion dentro del rango ya marcado -> no hacer nada
					breakSelection = true;
					break;
				} else if (startOffset > end || endOffset < start) {
					// seleccion fuera del rango -> no hay que recalcular
				} else if (startOffset < start && endOffset > end) {
					// seleccion mayor que el rango ya marcado -> borrar el
					// rango
					remove = true;
				} else {
					remove = true;
					if (start < startOffset) {
						startOffset = start;
					}
					if (end > endOffset) {
						endOffset = end;
					}
				}
				if (remove) {
					selectionsToRemove.push(dataAffected[i]);
				}
				i++;
			}

			if (!breakSelection) {
				i = 0;
				while (i < selectionsToRemove.length) {

					HighlightManager.dehighlightNode(selectionsToRemove[i],
							data);
					i++;
				}

				var spanId = node
						.getElementsByClassName(HIGHLIGHT_CSSCLASSNAME).length;
				var key = node.id + "-" + spanId;
				var nodeId = key + ":" + startOffset + "-" + endOffset;

				HighlightManager.highlightNode(nodeId, data);

				var historyItem = {
					highlightItem : nodeId,
					dehighlightItems : selectionsToRemove
				};

				historyCommand.push(historyItem);
			}
		}
		;

		var selection = rangy.getSelection();
		if (selection.toString().length > 0) {
			var data = null;
			data = HighlightManager.get();

			var range = selection.getRangeAt(0);

			var nodes = range.getNodes();

			var historyItem = new Array();

			var affectedNodes = new Array();
			var i;
			i = 0;
			while (i < nodes.length) {
				var affectedNode = HighlightManager.findNode(nodes[i]);
				if (HighlightManager.isLineNode(affectedNode)) {
					if (!arrayContains(affectedNodes, affectedNode)) {
						affectedNodes.push(affectedNode);
					}
				}
				i++;
			}

			if (affectedNodes.length == 1) {

				highlightOneLine(affectedNodes[0], range.startOffset,
						range.endOffset, data, historyItem);
				range.refresh();
			} else {

				var j = affectedNodes.length - 1, n = affectedNodes.length - 1;
				var node = null;
				while (j >= 0) {
					node = affectedNodes[j];
					if (node) {
						var startOffset = 0, endOffset = 0;
						if (j == n) {
							startOffset = 0;
							endOffset = range.endOffset;
						} else if (j == 0) {
							startOffset = range.startOffset;
							endOffset = node.textContent.length;
						} else {
							startOffset = 0;
							endOffset = node.textContent.length;
						}

						highlightOneLine(node, startOffset, endOffset, data,
								historyItem);

						range.refresh();
					}
					j--;
				}
			}
			// Store data
			HighlightManager.set(data);

			// Store history
			HighlightManager.history.push(historyItem);

			// Clear UI selection
			HighlightManager.clearSelection(selection);
		}
	},

	keydown : function highlightKeyDown(evt) {

		var cmd = (evt.ctrlKey ? 1 : 0) | (evt.altKey ? 2 : 0)
				| (evt.shiftKey ? 4 : 0) | (evt.metaKey ? 8 : 0);
		if (cmd === 0) { // no control key pressed at all.
			switch (evt.keyCode) {
			case 72: // 'h'
				HighlightManager.keyHandled = true;
				if (!HighlightManager.active) {
					if (HighlightManager.mouseHandled) {
						HighlightManager.toogleHighlight(evt);
					}
				}
				break;
			}
		}
	},

	keyup : function highlightKeyUp(evt) {

		var cmd = (evt.ctrlKey ? 1 : 0) | (evt.altKey ? 2 : 0)
				| (evt.shiftKey ? 4 : 0) | (evt.metaKey ? 8 : 0);
		if (cmd === 0) { // no control key pressed at all.
			switch (evt.keyCode) {
			case 72: // 'h'
				if (HighlightManager.active) {
					HighlightManager.toogleHighlight(evt);
				}
				HighlightManager.keyHandled = false;
				break;
			}
		} else if (evt.ctrlKey) {
			switch (evt.keyCode) {
			case 90: // 'z'
				if (HighlightManager.active) {
					HighlightManager.undo();
				}
				break;
			}
		}
	},

	mouseDown : function highlightMouseDown(evt) {

		HighlightManager.mouseHandled = true;
		if (!HighlightManager.active && HighlightManager.keyHandled) {
			HighlightManager.toogleHighlight(evt);
		}
	},

	mouseUp : function highlightMouseUp(evt) {

		if (HighlightManager.active) {

			HighlightManager.highlightSelection();
			if (HighlightManager.keyHandled) {
				HighlightManager.toogleHighlight(evt);
			}
		}

		HighlightManager.mouseHandled = false;
	},

	clearSelection : function clearSelection(selection) {

		if (selection) {
			if (selection.empty) { // Chrome
				selection.empty();
			} else if (selection.removeAllRanges) { // Firefox
				selection.removeAllRanges();
			}
		}
	},

	undo : function undoCommand() {
		var itemCommand = HighlightManager.history.pop();
		if (itemCommand) {
			var data = null;
			data = HighlightManager.get();
			var i = 0;
			while (i < itemCommand.length) {
				var item = itemCommand[i];
				HighlightManager.dehighlightNode(item.highlightItem, data);
				var j = 0;
				while (j < item.dehighlightItems.length) {
					HighlightManager.highlightNode(item.dehighlightItems[j],
							data);
					j++;
				}
				i++;
			}
		}
	},

	extractScheme : function extractSchemeCommand() {
		var doc = new jsPDF();
		var writePosition = 20;

		doc.setFont("times");

		doc.setFontSize(20);
		if (HighlightManager.view.documentInfo) {
			if (HighlightManager.view.documentInfo.Title) {
				doc.text(20, writePosition,
						HighlightManager.view.documentInfo.Title);
			}
			if (HighlightManager.view.documentInfo.Author) {
				doc.setFontSize(18);
				writePosition = writePosition + 10;
				doc.text(20, writePosition,
						HighlightManager.view.documentInfo.Author);
			}
		}
		doc.setFontSize(16);
		writePosition = writePosition + 10;
		var data = HighlightManager.get();

		var lineIndex = 0;
		var lineText = "";
		for ( var element in data.sort()) {

			var nodeDef = data[element].split('~')[0];

			var elementId = nodeDef.split(':')[0];

			var pageId = elementId.split(".")[0].replace(DIVNODE_PREFIX, "");
			var nodeId = elementId.split("-")[0];
			var lineId = nodeId.split(".")[1];
			var text = data[element].split('~')[1];

			// Quitar los caracteres unicode hasta que jsPDF lo soporte.
			text = text
					.replace(
							/[^A-Za-z 0-9 \.,\?'""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g,
							'');

			if (lineId != lineIndex) {
				lineIndex = lineId;
				writePosition = writePosition + 10;
				doc.text(20, writePosition, lineText);
				lineText = text;
			} else {
				lineText += text;
			}

			console.log(text);

		}
		if (lineText != "") {
			writePosition = writePosition + 10;
			doc.text(20, writePosition, lineText);
		}

		doc.save(SCHEMEFILENAME_PREFIX + HighlightManager.view.getFilename());
		doc = null;
	}

};