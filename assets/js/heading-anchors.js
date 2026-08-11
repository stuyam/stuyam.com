document.addEventListener("DOMContentLoaded", () => {
  const content = document.querySelector(".prose");
  if (!content) return;

  const linkIcon = `
    <svg class="heading-anchor-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  `;
  const checkIcon = `
    <svg class="heading-anchor-check" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  `;

  content.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]").forEach((heading) => {
    const id = heading.id;
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.className = "heading-anchor";
    link.setAttribute("aria-label", "Copy link to this section");
    link.innerHTML = `${linkIcon}${checkIcon}`;

    link.addEventListener("click", async (event) => {
      event.preventDefault();
      const url = `${window.location.origin}${window.location.pathname}#${id}`;

      try {
        await navigator.clipboard.writeText(url);
        history.replaceState(null, "", `#${id}`);
        link.classList.add("copied");
        link.setAttribute("aria-label", "Copied link to this section");
        window.setTimeout(() => {
          link.classList.remove("copied");
          link.setAttribute("aria-label", "Copy link to this section");
        }, 1500);
      } catch {
        window.location.hash = id;
      }
    });

    heading.appendChild(link);
  });
});
