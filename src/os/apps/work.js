import { projects } from '../../content.js'

const FOLDER = `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="13" rx="1.5" fill="#fff" stroke="#111" stroke-width="2"/><path d="M2 8 L5 4 H11 L13 7" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>`

export function workApp() {
  const el = document.createElement('div')
  el.className = 'app-work'
  projects.forEach((p) => {
    const row = document.createElement('a')
    row.className = 'row'
    row.href = p.url
    row.target = '_blank'
    row.rel = 'noreferrer noopener'
    const badge = p.badge ? `<em class="badge">${p.badge}</em>` : ''
    row.innerHTML = `${FOLDER}<span><b>${p.name}</b><i>${p.tag}</i>${badge}</span><span class="arr">OPEN</span>`
    el.appendChild(row)
  })
  return { el }
}
