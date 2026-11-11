// The React demo: the specimen rendered by React with the classes from useMise().
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MiseProvider, useMise } from '../../react/index.mjs';
import { TEXT } from '../specimen.mjs';

function Specimen() {
  const { classes } = useMise();
  return h('main', { id: 'spec' },
    ...Object.keys(classes).map((n) => h('p', { key: n, 'data-style': n, className: classes[n] }, TEXT)),
    h('div', { key: 'c', 'data-colors': '', style: { background: 'var(--fr-surface)', color: 'var(--fr-muted)', border: '1px solid var(--fr-border)' } }, 'muted on surface'));
}
createRoot(document.getElementById('root')).render(h(MiseProvider, { recipe: window.RECIPE, baseUrl: window.FONTS_URL || '/fonts' }, h(Specimen)));
