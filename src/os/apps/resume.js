import { resume, profile } from '../../content.js'

export function resumeApp() {
  const el = document.createElement('div')
  el.className = 'app-resume'

  const section = (title, rows) => `
    <h3>${title}</h3>
    ${rows.map((r) => `<div class="line"><span><b>${r.title}</b> — ${r.place}</span>${r.years ? `<i>${r.years}</i>` : ''}</div>`).join('')}
  `
  const list = (title, items) => `
    <h3>${title}</h3>
    ${items.map((item) => `<div class="line"><span>${item}</span></div>`).join('')}
  `
  el.innerHTML = `
    <div class="award">★ <b>${resume.award.title}</b><br>${resume.award.detail}</div>
    ${section('Education', resume.education)}
    ${section('Experience', resume.experience)}
    ${section('Activities', resume.activities)}
    <h3>Skills</h3>
    <div class="chips">${resume.skills.map((s) => `<span>${s}</span>`).join('')}</div>
    ${list('Certificates', resume.certificates)}
    <h3>Languages</h3>
    <div class="line"><span>${resume.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}</span></div>
    <h3>Full resume</h3>
    <div class="line"><span>Ask me directly →</span><i><a href="mailto:${profile.email}" style="color:#111">${profile.email}</a></i></div>
  `
  return { el }
}
