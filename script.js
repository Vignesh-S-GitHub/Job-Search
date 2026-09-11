const defaults={keywords:'Azure Data Engineer Databricks PySpark ADF ADLS SQL Python',minExp:'4',maxExp:'6',location:'India',datePosted:'24h',sortBy:'date'};
let state=loadState();

const presets=[
 {id:'daily',title:'Fresh jobs · 24h',copy:'Primary daily scan across the portals that support date filtering.',patch:{datePosted:'24h',keywords:'Azure Data Engineer Databricks PySpark ADF ADLS SQL Python'}},
 {id:'catchup',title:'Catch-up · 7 days',copy:'Use every 2–3 days to catch anything missed.',patch:{datePosted:'7d',keywords:'Azure Data Engineer Databricks PySpark ADF ADLS SQL Python'}},
 {id:'databricks',title:'Databricks / PySpark',copy:'Broader lakehouse search for Azure Databricks and PySpark roles.',patch:{datePosted:'24h',keywords:'Databricks PySpark Azure Data Engineer'}},
];

const dateSeconds={"24h":"r86400","7d":"r604800","30d":"r2592000"};
const dateDays={"24h":"1","7d":"7","30d":"30"};

function hiristPath(s){
 const q=s.keywords.toLowerCase();
 if(q.includes('azure')&&q.includes('databricks')) return 'azure-databricks-jobs';
 if(q.includes('databricks')) return 'databricks-jobs';
 if(q.includes('pyspark')) return 'pyspark-jobs';
 return 'data-engineering-jobs';
}

const portals=[
 {
  id:'linkedin',name:'LinkedIn',logo:'logos/linkedin.png',support:'Keywords · location · date · full-time · newest',level:'direct',
  build:s=>{const u=new URL('https://www.linkedin.com/jobs/search/');u.searchParams.set('keywords',s.keywords);u.searchParams.set('location',s.location);u.searchParams.set('f_TPR',dateSeconds[s.datePosted]||dateSeconds['24h']);u.searchParams.set('f_JT','F');if(s.sortBy==='date')u.searchParams.set('sortBy','DD');return u}
 },
 {
  id:'naukri',name:'Naukri',logo:'logos/naukri.png',support:'Keywords · location · 4+ yrs · date · newest',level:'partial',
  note:'Naukri reliably accepts a single experience value in the URL. The dashboard sends your minimum (4 yrs); check the role is within your 4–6 target before applying.',
  build:s=>{const u=new URL('https://www.naukri.com/jobs-in-india');u.searchParams.set('k',s.keywords);u.searchParams.set('l',s.location);u.searchParams.set('experience',s.minExp);u.searchParams.set('jobAge',dateDays[s.datePosted]||'1');if(s.sortBy==='date')u.searchParams.set('sort','date');return u}
 },
 {
  id:'hirist',name:'Hirist',logo:'logos/hirist.png',support:'Native skill/category page · refine exp/date on Hirist',level:'manual',
  note:'Hirist exposes experience, location and posting filters in its own UI, but those filter values are not stable URL parameters. This opens the closest native skill page instead of a Google search.',
  build:s=>new URL(`https://www.hirist.tech/k/${hiristPath(s)}`)
 },
 {
  id:'instahyre',name:'Instahyre',logo:'logos/instahyre.png',support:'Profile-based matching opportunities',level:'manual',
  note:'Instahyre primarily matches opportunities from your profile, skills, location and notice period. The dashboard opens the matching-opportunities view; keep your profile preferences updated.',
  build:()=>new URL('https://www.instahyre.com/candidate/opportunities/?matching=true')
 },
 {
  id:'indeed',name:'Indeed',logo:'logos/indeed.png',support:'Keywords · location · date · newest',level:'direct',
  build:s=>{const u=new URL('https://in.indeed.com/jobs');u.searchParams.set('q',s.keywords);u.searchParams.set('l',s.location);u.searchParams.set('fromage',dateDays[s.datePosted]||'1');if(s.sortBy==='date')u.searchParams.set('sort','date');return u}
 },
];

const presetGrid=document.getElementById('presetGrid');
const portalGrid=document.getElementById('portalGrid');
const dialog=document.getElementById('filterDialog');
const form=document.getElementById('filterForm');
const toast=document.getElementById('toast');

function loadState(){
 const p=new URLSearchParams(location.search);
 if(![...p.keys()].length)return {...defaults};
 return {...defaults,keywords:p.get('q')||defaults.keywords,minExp:p.get('min')||defaults.minExp,maxExp:p.get('max')||defaults.maxExp,location:p.get('loc')||defaults.location,datePosted:p.get('date')||defaults.datePosted,sortBy:p.get('sort')||defaults.sortBy};
}
function persist(){
 const p=new URLSearchParams();
 p.set('q',state.keywords);p.set('min',state.minExp);p.set('max',state.maxExp);p.set('loc',state.location);p.set('date',state.datePosted);p.set('sort',state.sortBy);
 history.replaceState(null,'',`${location.pathname}?${p.toString()}`);render();
}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
function statusClass(level){return level==='direct'?'filter-direct':level==='partial'?'filter-partial':'filter-manual'}

function render(){
 presetGrid.innerHTML='';
 presets.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='preset-card'+(state.datePosted===p.patch.datePosted&&state.keywords===p.patch.keywords?' active':'');b.innerHTML=`<span class="preset-title">${p.title}</span><span class="preset-copy">${p.copy}</span>`;b.onclick=()=>{state={...state,...p.patch};persist();showToast(`${p.title} selected`)};presetGrid.appendChild(b)});
 portalGrid.innerHTML='';
 portals.forEach(p=>{
  const b=document.createElement('button');b.type='button';b.className='portal-card';
  b.innerHTML=`<span class="portal-logo"><img src="${p.logo}" alt="${p.name} logo" loading="lazy"></span><span class="portal-name">${p.name}</span><span class="portal-support ${statusClass(p.level)}">${p.support}</span>${p.note?`<span class="portal-note">${p.note}</span>`:''}`;
  b.onclick=()=>window.open(p.build(state).toString(),'_blank','noopener,noreferrer');portalGrid.appendChild(b)
 });
}

function fillForm(){form.keywords.value=state.keywords;form.minExp.value=state.minExp;form.maxExp.value=state.maxExp;form.location.value=state.location;form.datePosted.value=state.datePosted;form.sortBy.value=state.sortBy}
document.getElementById('editBtn').onclick=()=>{fillForm();dialog.showModal()};
document.getElementById('closeBtn').onclick=()=>dialog.close();
document.getElementById('resetBtn').onclick=()=>{state={...defaults};fillForm()};
form.onsubmit=e=>{e.preventDefault();const min=Number(form.minExp.value),max=Number(form.maxExp.value);if(min>max){showToast('Minimum experience cannot exceed maximum');return}state={keywords:form.keywords.value.trim()||defaults.keywords,minExp:form.minExp.value||defaults.minExp,maxExp:form.maxExp.value||defaults.maxExp,location:form.location.value.trim()||defaults.location,datePosted:form.datePosted.value,sortBy:form.sortBy.value};persist();dialog.close();showToast('Filters saved')};
document.getElementById('shareBtn').onclick=async()=>{persist();try{await navigator.clipboard.writeText(location.href);showToast('Dashboard link copied')}catch{prompt('Copy this dashboard link:',location.href)}};
document.getElementById('openAllBtn').onclick=()=>{if(!confirm('Open all 5 job portals? Some mobile browsers may block multiple tabs.'))return;portals.forEach((p,i)=>setTimeout(()=>window.open(p.build(state).toString(),'_blank','noopener,noreferrer'),i*300))};
persist();
