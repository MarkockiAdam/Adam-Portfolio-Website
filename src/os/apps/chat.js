import { profile } from '../../content.js'

export function chatApp() {
  const el = document.createElement('div')
  el.className = 'app-chat'
  el.innerHTML = `
    <div class="face">:^)</div>
    <p>Got a project, a question,<br>or just want to say hi?</p>
    <a class="mailbtn" href="mailto:${profile.email}">SEND ME A MESSAGE</a>
    <div class="socials">
      <a href="${profile.github}" target="_blank" rel="noreferrer noopener">github</a>
      <a href="${profile.linkedin}" target="_blank" rel="noreferrer noopener">linkedin</a>
      <a href="${profile.x}" target="_blank" rel="noreferrer noopener">x</a>
    </div>
  `
  return { el }
}
