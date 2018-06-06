const {TextHighlightController} = require("./TextHighlightController");
const {TextHighlightRenderer} = require("./TextHighlightRenderer");

require("../../../../lib/TextHighlighter.js");

const TextHighlighter = global.TextHighlighter;

module.exports.TextHighlightControllers = class {

    static create() {

        return new TextHighlightController(this.createTextHighlighter());

    }

    /**
     * Set text highlighting in the current document with the highlighter.
     */
    static createTextHighlighter() {

        var sequence = 0;

        var textHighlighterOptions = {

            highlightedClass: "text-highlight-span",
            color: '', // this works and the color isn't changed.
            manual: true,

            onBeforeHighlight: function (range) {
                //console.log("onBeforeHighlight range: ", range);
                return true;
            },
            onAfterHighlight: function (range, highlightElements) {
                // console.log("onAfterHighlight range: ", range);
                // console.log("onAfterHighlight hlts: ", highlightElements);

                let id = sequence++;
                let highlightClazz = "text-highlight-" + id;

                highlightElements.forEach(function (highlightElement) {
                    //highlightElement.style.color = 'blue';
                    highlightElement.className = highlightElement.className + " " + highlightClazz;
                });

                // FIXME: use the highlightElements to get the text of the nodes
                // then compute a hashcode to determine the ID of the highlight.

                TextHighlightRenderer.create("." + highlightClazz);

            },

            onRemoveHighlight: function (hlt) {
                // console.log("onRemoveHighlight hlt: ", hlt);
            }

        };

        return new TextHighlighter(document.body, textHighlighterOptions);

    }

}
