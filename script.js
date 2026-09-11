const defaults={keywords:'"Data Engineer" Azure Databricks PySpark ADF ADLS SQL Python',minExp:'4',maxExp:'6',location:'India',datePosted:'24h',sortBy:'date'};
let state=loadState();

const presets=[
 {id:'daily',title:'Fresh jobs · 24h',copy:'Primary daily scan across all five portals.',patch:{datePosted:'24h',keywords:'"Data Engineer" Azure Databricks PySpark ADF ADLS SQL Python'}},
 {id:'catchup',title:'Catch-up · 7 days',copy:'Use every 2–3 days to catch anything missed.',patch:{datePosted:'7d',keywords:'"Data Engineer" Azure Databricks PySpark ADF ADLS SQL Python'}},
 {id:'databricks',title:'Databricks / PySpark',copy:'Broader role-title coverage for Azure lakehouse roles.',patch:{datePosted:'24h',keywords:'Databricks PySpark Azure "Data Engineer"'}},
];

const portals=[
 {id:'linkedin',name:'LinkedIn',abbr:'in',build:s=>{const u=new URL('https://www.linkedin.com/jobs/search/');u.searchParams.set('keywords',s.keywords);u.searchParams.set('location',s.location);u.searchParams.set('f_TPR',s.datePosted==='24h'?'r86400':s.datePosted==='7d'?'r604800':'r2592000');u.searchParams.set('f_JT','F');if(s.sortBy==='date')u.searchParams.set('sortBy','DD');return u}},
 {id:'naukri',name:'Naukri',abbr:'N',build:s=>{const u=new URL('https://www.naukri.com/jobs');u.searchParams.set('k',s.keywords);u.searchParams.set('l',s.location);u.searchParams.set('experience',`${s.minExp}to${s.maxExp}`);u.searchParams.set('jobAge',s.datePosted==='24h'?'1':s.datePosted==='7d'?'7':'30');if(s.sortBy==='date')u.searchParams.set('sort','date');return u}},
 {id:'hirist',name:'Hirist',abbr:'H',build:s=>{const q=`site:hirist.tech ${s.keywords} ${s.minExp} ${s.maxExp} years`;return new URL(`https://www.google.com/search?q=${encodeURIComponent(q)}`)}},
 {id:'instahyre',name:'Instahyre',abbr:'I',build:s=>{const q=`site:instahyre.com ${s.keywords} ${s.location}`;return new URL(`https://www.google.com/search?q=${encodeURIComponent(q)}`)}},
 {id:'indeed',name:'Indeed',abbr:'i',build:s=>{const u=new URL('https://in.indeed.com/jobs');u.searchParams.set('q',s.keywords);u.searchParams.set('l',s.location);u.searchParams.set('fromage',s.datePosted==='24h'?'1':s.datePosted==='7d'?'7':'30');if(s.sortBy==='date')u.searchParams.set('sort','date');return u}},
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
 history.replaceState(null,'',`${location.pathname}?${p.toString()}`);
 render();
}

function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}

function render(){
 presetGrid.innerHTML='';
 presets.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='preset-card'+(state.datePosted===p.patch.datePosted&&state.keywords===p.patch.keywords?' active':'');b.innerHTML=`<span class="preset-title">${p.title}</span><span class="preset-copy">${p.copy}</span>`;b.onclick=()=>{state={...state,...p.patch};persist();showToast(`${p.title} selected`)};presetGrid.appendChild(b)});
 portalGrid.innerHTML='';
 portals.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='portal-card';b.innerHTML=`<span class="portal-logo">${p.abbr}</span><span class="portal-name">${p.name}</span>`;b.onclick=()=>window.open(p.build(state).toString(),'_blank','noopener,noreferrer');portalGrid.appendChild(b)});
}

function fillForm(){form.keywords.value=state.keywords;form.minExp.value=state.minExp;form.maxExp.value=state.maxExp;form.location.value=state.location;form.datePosted.value=state.datePosted;form.sortBy.value=state.sortBy}

document.getElementById('editBtn').onclick=()=>{fillForm();dialog.showModal()};
document.getElementById('closeBtn').onclick=()=>dialog.close();
document.getElementById('resetBtn').onclick=()=>{state={...defaults};fillForm()};
form.onsubmit=e=>{e.preventDefault();const min=Number(form.minExp.value),max=Number(form.maxExp.value);if(min>max){showToast('Minimum experience cannot exceed maximum');return}state={keywords:form.keywords.value.trim()||defaults.keywords,minExp:form.minExp.value||defaults.minExp,maxExp:form.maxExp.value||defaults.maxExp,location:form.location.value.trim()||defaults.location,datePosted:form.datePosted.value,sortBy:form.sortBy.value};persist();dialog.close();showToast('Filters saved')};

document.getElementById('shareBtn').onclick=async()=>{persist();try{await navigator.clipboard.writeText(location.href);showToast('Dashboard link copied')}catch{prompt('Copy this dashboard link:',location.href)}};
document.getElementById('openAllBtn').onclick=()=>{if(!confirm('Open all 5 job searches in new tabs?'))return;portals.forEach((p,i)=>setTimeout(()=>window.open(p.build(state).toString(),'_blank','noopener,noreferrer'),i*250))};

persist();
