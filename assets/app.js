'use strict';
(() => {
  const key = 'gonggu-review-favorites-v1';
  let favorites = new Set();
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(value)) favorites = new Set(value.filter(x => typeof x === 'string')); } catch (_) {}
  const catalog = window.reviewCatalog;
  const grid = document.getElementById('products');
  const names = {all:'전체', current:'진행 중', upcoming:'오픈 예정', past:'지난 공구', unknown:'일정 미확인', favorites:'관심 제품'};
  let view='all', query='', page=1;
  const size=60;
  function refreshFavorites() {
    document.querySelectorAll('[data-favorite]').forEach(button => {
      const saved=favorites.has(button.dataset.favorite);
      button.textContent=saved ? '♥ 관심 저장됨' : '♡ 관심';
      button.setAttribute('aria-pressed', String(saved));
    });
    document.getElementById('fav-count').textContent=favorites.size || '';
  }
  function readURL() {
    const params = new URLSearchParams(location.search);
    view = Object.hasOwn(names, params.get('view')) ? params.get('view') : 'all';
    query = (params.get('q') || '').slice(0,200);
    page = Math.max(1, parseInt(params.get('page'),10) || 1);
  }
  function url(nextView, nextPage=1) {
    const params=new URLSearchParams({view:nextView, q:query});
    if(nextPage>1) params.set('page',nextPage);
    return './index.html?'+params;
  }
  function render() {
    if (!grid || !catalog) { refreshFavorites(); return; }
    const q=query.toLocaleLowerCase();
    const matches=id=>catalog.search[id].toLocaleLowerCase().includes(q);
    const entries=catalog.views[view==='favorites' ? 'all' : view].filter(([id])=>matches(id) && (view!=='favorites' || favorites.has(id)));
    const pages=Math.max(1,Math.ceil(entries.length/size));
    page=Math.min(page,pages);
    grid.dataset.view=view;
    grid.innerHTML=entries.slice((page-1)*size,page*size).map(x=>x[1]).join('');
    document.getElementById('q').value=query;
    document.querySelector('.section-head h2').textContent=names[view];
    document.getElementById('result-count').textContent=`${entries.length.toLocaleString('ko-KR')}개 제품군 · ${page} / ${pages} 페이지`;
    document.getElementById('empty').hidden=entries.length!==0;
    document.querySelectorAll('.tabs a').forEach(a=>{
      const target=new URL(a.href).searchParams.get('view') || 'all';
      a.href=url(target); a.classList.toggle('active',view===target);
      if(view===target) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
      const count=a.querySelector('b'); if(count) count.textContent=catalog.views[target].filter(([id])=>matches(id)).length.toLocaleString('ko-KR');
    });
    const nav=document.getElementById('pagination'); nav.replaceChildren();
    for(const [label,p] of [['이전',page-1],['다음',page+1]]) {
      const button=document.createElement('button'); button.textContent=label; button.disabled=p<1||p>pages;
      button.addEventListener('click',()=>navigate(view,p)); nav.append(button);
    }
    refreshFavorites();
  }
  function navigate(nextView,nextPage=1) {
    history.pushState({},'',url(nextView,nextPage)); readURL(); render();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-favorite]');
    if(button) {
      const id=button.dataset.favorite;
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      try { localStorage.setItem(key,JSON.stringify([...favorites])); } catch (_) { button.title='브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 유지됩니다.'; }
      if(view==='favorites' && grid) render(); else refreshFavorites();
      return;
    }
    const a=event.target.closest('a');
    if(grid && a && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button===0) {
      const target=new URL(a.href);
      if(target.origin===location.origin && target.pathname===new URL('./index.html',location.href).pathname) {
        event.preventDefault(); history.pushState({},'',target.href); readURL(); render();
      }
    }
  });
  if(grid) {
    document.querySelector('form[role=search]').addEventListener('submit',event=>{event.preventDefault(); query=document.getElementById('q').value.slice(0,200); navigate(view);});
    addEventListener('popstate',()=>{readURL();render();});
  }
  addEventListener('storage',event=>{
    if(event.key!==key) return;
    try {const value=JSON.parse(event.newValue||'[]'); favorites=new Set(Array.isArray(value)?value.filter(x=>typeof x==='string'):[]);}catch(_){favorites=new Set();}
    render();
  });
  readURL();render();
})();
