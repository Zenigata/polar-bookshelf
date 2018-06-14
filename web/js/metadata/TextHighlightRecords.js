const {ISODateTime} = require("./ISODateTime");
const {TextHighlight} = require("./TextHighlight");
const {Hashcodes} = require("../Hashcodes");
const {Arrays} = require("../util/Arrays");

class TextHighlightRecords {

    static createID(rects) {

        let id = Hashcodes.create(JSON.stringify(rects));

        // truncate.  We don't need that much precision against collision.
        return id.substring(0,10);

    }

    /**
     * Create a TextHighlight by specifying all required rows.
     *
     * We also automatically assign the created and lastUpdated values of this
     * object as we're working with it.
     *
     * @return an object with an "id" for a unique hash and a "value" of the
     * TextHighlight to use.
     */
    static create(rects, textSelections, text) {

        let id = TextHighlightRecords.createID(rects);

        let created = new ISODateTime(new Date());
        let lastUpdated = created.duplicate();

        let textHighlight = new TextHighlight({
            id,
            created,
            lastUpdated,
            rects: Arrays.toDict(rects),
            textSelections: Arrays.toDict(textSelections),
            text
        });

        return {id, value: textHighlight};

    }

};

module.exports.TextHighlightRecords = TextHighlightRecords;
