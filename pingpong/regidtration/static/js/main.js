document.addEventListener("DOMContentLoaded", function () {
    function Navigate(page) {
        let container = document.getElementById("content");
        fetch("/" + page + "/")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Page not found: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
            })
            .catch(error => {
                console.error("Error fetching regidtration", error);
                container.innerHTML = `<h2>Page not found: ${page}</h2>`;
            });
    }

    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", function (event){
            event.preventDefault();

            let page = this.getAttribute("href").substring(1);

            Navigate(page);
        });
    });
    function injectCSRFToken(formElement) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrfmiddlewaretoken';
        csrfInput.value = csrfToken;
        formElement.appendChild(csrfInput);
    }
    Navigate("");
});