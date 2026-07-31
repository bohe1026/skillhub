(() => {
  const reportHeight = () => {
    const height = Math.ceil(document.documentElement.getBoundingClientRect().height)
    window.parent.postMessage({ type: 'skillcenter:embed-resize', height }, window.location.origin)
  }

  window.addEventListener('load', reportHeight)
  window.addEventListener('message', (event) => {
    if (event.origin === window.location.origin && event.source === window.parent && event.data?.type === 'skillcenter:measure-embed') {
      reportHeight()
    }
  })
  new ResizeObserver(reportHeight).observe(document.documentElement)
  document.fonts.ready.then(reportHeight)
  setTimeout(reportHeight, 500)
  setTimeout(reportHeight, 1500)
})()
