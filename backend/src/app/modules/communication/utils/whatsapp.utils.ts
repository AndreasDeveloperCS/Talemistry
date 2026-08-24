import { NotificationTemplate } from '../enums/notification-templates.enum';
import { WhatsAppTemplateButtons, WhatsAppTemplates, WhatsAppTemplateVariables } from '../enums/whatsapp-templates.enum';

export function buildTemplateComponents<K extends NotificationTemplate>(
  key: K,
  vars: WhatsAppTemplateVariables[K],
) {
  const template = WhatsAppTemplates[key];
  const buttons = WhatsAppTemplateButtons[key];

  const components: any[] = [];

  // 1️⃣ HEADER
  if (template.headerVariables && template.headerVariables.length > 0) {
    const headerParams = template.headerVariables.map((name) => {
      const value = vars[name];
      if (!value) {
        throw new Error(`WhatsApp template header variable "${name}" is empty!`);
      }
      return { type: 'text', parameter_name: name, text: String(value) };
    });

    components.push({
      type: 'HEADER',
      parameters: headerParams,
    });
  }

  // 2️⃣ BODY
  if (template.variables.length > 0) {
    const bodyParams = template.variables.map((name) => {
      const value = vars[name];
      if (!value) {
        throw new Error(`WhatsApp template body variable "${name}" is empty!`);
      }
      return { type: 'text', parameter_name: name, text: String(value) };
    });

    components.push({
      type: 'BODY',
      parameters: bodyParams,
    });
  }

  // 3️⃣ BUTTONS
  buttons.forEach((btn) => {
    const value = vars[btn.variable];
    if (!value) {
      throw new Error(`WhatsApp template button variable "${btn.variable}" is empty!`);
    }

    components.push({
      type: 'BUTTON',
      sub_type: 'URL',        // Always 'url' for link buttons
      index: btn.index,       // Must match template definition
      parameters: [
        { type: 'text', text: String(value) },
      ],
    });
  });

  console.log('Whatsapp template components', JSON.stringify(components, null, 2));

  return components;
}