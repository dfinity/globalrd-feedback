import { TopicInfo } from '../stores/topicStore';
import Turndown from 'turndown';

const turndown = new Turndown();

function htmlDecode(escaped: string): string {
  var e = document.createElement('textarea');
  e.innerHTML = escaped;
  return e.childNodes[0]?.nodeValue ?? '';
}

function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}

export default function parseJiraXml(xml: string): TopicInfo[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const getFields = (item: Element, name: string): string[] => {
    return [...item.getElementsByTagName(name)].map((item) => item.innerHTML);
  };

  const getField = (item: Element, name: string): string => {
    const fields = getFields(item, name);
    if (!fields.length) {
      console.warn(item);
      throw new Error(`Expected field '${name}' in Jira issue`);
    }
    return fields[0];
  };

  // TODO: detect topic status from 'status' field when possible

  return [...doc.getElementsByTagName('item')].map((item) => {
    return {
      title: getField(item, 'title'),
      description: htmlToMarkdown(htmlDecode(getField(item, 'description'))),
      links: [...getFields(item, 'link')],
      tags: [
        ...getFields(item, 'project'),
        ...getFields(item, 'priority'),
        ...getFields(item, 'status'),
      ],
    };
  });
}
