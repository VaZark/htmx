(function () {
    function getKeyValueFromJson(jsonData, key) {
        const keys = key.split(".");
        let value = jsonData;
        keys.forEach((key) => {
            value = value[key];
        });
        return value;
    }

    function insertJsonToSlot(templateNode, jsonData) {
        const children = templateNode.children;
        for (let index = 0; index < children.length; index++) {
            const element = children[index];
            if (!element.hasAttribute("slot-value")) {
                continue;
            }
            const slotValue = element.getAttribute("slot-value");
            const slotKeyValue = getKeyValueFromJson(jsonData, slotValue);

            if (element.hasAttribute("slot-template")) {
                const slotTemplateId = element.getAttribute("slot-template");
                if (slotTemplateId) {
                    const slotTemplate = htmx.find("#" + slotTemplateId);
                    const elementContent = slotTemplate.content.cloneNode(true);
                    if (slotKeyValue instanceof Array) {
                        slotKeyValue.forEach((slotKeyItem) => {
                            insertJsonToSlot(elementContent, slotKeyItem);
                        });
                    } else if (slotKeyValue instanceof Object) {
                        insertJsonToSlot(elementContent, slotKeyValue);
                    }
                    element.replaceWith(elementContent);
                }
            } else {
                const slotAttrs = element.attributes;
                Array.from(slotAttrs).forEach(({ name, nodeValue }) => {
                    if (name.startsWith("slot-")) {
                        const targetAttr = name.substring(5);
                        element.setAttribute(targetAttr, getKeyValueFromJson(jsonData, nodeValue));
                        element.removeAttribute(name);
                    }
                });
            }
        }
    }

    htmx.defineExtension("slot-json", {
        transformResponse: function (text, xhr, elt) {
            var slotTemplate = htmx.closest(elt, "[slot-template]");
            if (slotTemplate) {
                var data = JSON.parse(text);
                var templateName = slotTemplate.getAttribute("slot-template");
                var template = htmx.find("#" + templateName);
                if (!template) {
                    return text;
                } else {
                    const responseFragment = template.content.cloneNode(true);
                    insertJsonToSlot(responseFragment, data);
                    return responseFragment;
                }
            }

            return text;
        },
    });
})();
