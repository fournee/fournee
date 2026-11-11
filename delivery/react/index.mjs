/* Fournée for React (build phase 6): a thin wrapper. It sets the recipe's variables on the page and exposes the role
   class names; there is no component library. Plain ES module, no JSX, so it needs no build step of its own.

     import { MiseProvider, useMise, miseHead } from '@fournee/delivery/react';
     import '@fournee/delivery/mise.css';

     <MiseProvider recipe={recipe} baseUrl="/fonts">
       <App />                      // inside: const { classes } = useMise();  <h1 className={classes['heading-xl']}>
     </MiseProvider>

   First paint: a client-only app applies the recipe in useLayoutEffect, before the browser paints the first commit.
   With server rendering (Next, Remix), write miseHead(recipe, { baseUrl }).html into the document <head> and its
   htmlAttrs onto <html>, so the look is in the first bytes; MiseProvider then only keeps it current. If the
   framework already self-hosts a family (next/font), let one of the two generate @font-face, not both. */
import { createElement, createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { MiseApply } from '../dist/mise.mjs';

const MiseContext = createContext(null);
const useIsoLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : () => {};

export function MiseProvider({ recipe, baseUrl = 'fonts', id = 'mise', children }) {
  const key = JSON.stringify(recipe || {});   // re-apply only when the recipe's content changes
  const value = useMemo(() => {
    const clean = MiseApply.clean(recipe);
    return { recipe: clean, classes: MiseApply.classes(clean) };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useIsoLayoutEffect(() => { MiseApply.apply(value.recipe, { baseUrl, id }); }, [value, baseUrl, id]);
  return createElement(MiseContext.Provider, { value }, children);
}

/** { recipe, classes } from the nearest MiseProvider. */
export function useMise() {
  const v = useContext(MiseContext);
  if (!v) throw new Error('useMise() needs a <MiseProvider> above it');
  return v;
}

/** The class name for one style ('heading-xl', 'ui-button', …), without a provider. */
export function miseClass(recipe, style) { return MiseApply.classes(recipe)[style]; }

/** For server rendering: { html, htmlAttrs, css } for the document head. */
export function miseHead(recipe, opts) { return MiseApply.head(recipe, opts); }

export { MiseApply };
