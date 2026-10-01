// Utilitários de interface usados por vários módulos.
export const $ = id => document.getElementById(id);

export const fmt = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export const setStatus = text => { $('status').textContent = text; };

export const tolerance = () => Number($('tolerance').value);

/** Marca como ativo o botão `[data-<attr>]` cujo valor é `value`. */
export function setActive(attr, value) {
  document.querySelectorAll(`[data-${attr}]`)
    .forEach(b => b.classList.toggle('active', b.dataset[attr] === value));
}
