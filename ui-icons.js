(function(){
  const paths={
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    book:'<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    layers:'<path d="m12 2-9 5 9 5 9-5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    idea:'<path d="M9 18h6M10 22h4M8.5 14.5A6 6 0 1 1 15.5 14.5c-.9.6-1.5 1.6-1.5 2.5h-4c0-.9-.6-1.9-1.5-2.5z"/>',
    connections:'<circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="m8 11 8-4M8 13l8 4"/>',
    dictionary:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 5.5v14M8 7h8M8 11h6"/>',
    gamepad:'<path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><path d="M5.5 6h13A3.5 3.5 0 0 1 22 9.5v5a3.5 3.5 0 0 1-6.8 1.2L14.6 14H9.4l-.6 1.7A3.5 3.5 0 0 1 2 14.5v-5A3.5 3.5 0 0 1 5.5 6z"/>',
    quiz:'<path d="M9 5h6M9 3v4M5 5h2M5 9h14M5 13h14M5 17h9"/><path d="m16 18 2 2 4-5"/>',
    branch:'<circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 5h3a3 3 0 0 1 3 3v8a3 3 0 0 0 3 3M14 10V8a3 3 0 0 1 3-3"/>',
    arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',arrowLeft:'<path d="M19 12H5M11 18l-6-6 6-6"/>',check:'<path d="m5 12 4 4L19 6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.4 5.6L8 16l2.4-5.6z"/>',sparkles:'<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"/>'
  };
  window.LiteraryIcons={render(name,className=''){return `<svg class="lit-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.book}</svg>`}};
})();
