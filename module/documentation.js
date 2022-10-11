
/** Founcry VTT Application meant to view Ironclaw's markdown files within Foundry itself
 *  @extends {Application}
 */
export class IronclawDocumentationViewer extends Application {
    /**
     * Create a new document viewer
     * @param {string} path The path to the markdown file
     * @param {any} options
     */
    constructor(path, options) {
        super(options);
        this.path = path;
    }

    /**
     * Bi-directional HTML <-> Markdown converter.
     * @type {showdown.Converter}
     * @protected
     */
    static _converter = (() => {
        Object.entries(CONST.SHOWDOWN_OPTIONS).forEach(([k, v]) => showdown.setOption(k, v));
        return new showdown.Converter();
    })();

    /**
     * @override
     * @returns {DocumentSheetOptions}
     */
    static get defaultOptions() {
        let options = foundry.utils.mergeObject(super.defaultOptions, {
            title: game.i18n.localize("ironclaw2e.documentViewer.defaultTitle"),
            template: `systems/ironclaw2e/templates/popup/document-viewer.html`,
            width: 700,
            height: 900,
            resizable: true
        });
        options.classes.push("markdown");
        return options;
    }

    /** @override */
    async getData(options) {
        let md = "";
        try {
            md = await (await fetch(this.path)).text();
        } catch (err) {
            console.error(err);
        }
        let converted = await TextEditor.enrichHTML(IronclawDocumentationViewer._converter.makeHtml(md), { async: true });
        return {
            "doc": converted
        };
    }

    /** @override */
    async _updateObject(event, formData) {

    }
}