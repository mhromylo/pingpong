async function checkAuth() {
    try {
        let response = await fetch("/check-auth/");
        console.log(response);
        let data = await response.json();
        console.log(data);
        if (data.authenticated) {
            document.getElementById("auth-nav").style.display = "flex";
            document.getElementById("guest-nav").style.display = "none";
        } else {
            document.getElementById("auth-nav").style.display = "none";
            document.getElementById("guest-nav").style.display = "flex";
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}

export function fetchNewCSRFToken() {
    fetch("/get_csrf_token/", {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.csrf_token) {
            document.querySelector('meta[name="csrf-token"]').setAttribute("content", data.csrf_token);
            let csrfInput = document.querySelector('#logout-form input[name="csrfmiddlewaretoken"]');
            if (csrfInput) {
                csrfInput.value = data.csrf_token;
            }
        } else {
            console.error("CSRF token response did not contain a token.");
        }
    })
    .catch(error => console.error("CSRF Token Fetch Error:", error));
}

    function getCSRFToken() {
        let csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]');
        if (!csrfToken) {
            csrfToken = document.cookie.split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
        }
        return csrfToken;
    }

    function loadMyCanvasScript() {
        var existingScript = document.querySelector('script[src="/static/js/tournament.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        var script = document.createElement('script');
        script.type = 'module';
        script.src = "/static/js/tournament.js";
        script.onload = function() {};
        document.head.appendChild(script);
    }

    const container = document.getElementById("content");

    export function loadPage(url, addToHistory = true, additionalParam = null) {
        if (additionalParam) {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.append('language_code', additionalParam);
            url = urlObj.toString();
        }
        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
    
                // Extract and replace content
                const newContent = tempDiv.querySelector('#content');
                if (newContent) {
                    document.getElementById('content').innerHTML = newContent.innerHTML;
                }

                // Reattach event listeners for dynamically loaded forms
                attachFormEventListeners();
                fetchNewCSRFToken(); // Refresh CSRF token for dynamically loaded forms
                checkAuth();
    
                // Update browser history
                if (addToHistory) {
                    history.pushState({ path: url }, "", url);
                }
                if (url === '/game_setup/' || url === '/tournament/')
                    loadMyCanvasScript();
                if (url === '/user_dashboard/'){
                    tempDiv.querySelectorAll('script').forEach(script => {
                        const newScript = document.createElement('script');
                
                        // Copy attributes (e.g., src, type) from the original script
                        Array.from(script.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                
                        // Append the script content
                        newScript.text = script.text;
                
                        // Append the new script to the document body
                        document.body.appendChild(newScript);
                
                        // Remove the new script after execution
                        document.body.removeChild(newScript);
                    });
                    renderWinLossChart();
                    renderGameTypeChart();
                }
                if (url === '/game_dashboard/'){
                    tempDiv.querySelectorAll('script').forEach(script => {
                        const newScript = document.createElement('script');
                
                        // Copy attributes (e.g., src, type) from the original script
                        Array.from(script.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                
                        // Append the script content
                        newScript.text = script.text;
                
                        // Append the new script to the document body
                        document.body.appendChild(newScript);
                
                        // Remove the new script after execution
                        document.body.removeChild(newScript);
                    });
                    renderTopWinnersChart();
                    renderTypeChart();
                }
                    

            })
            .catch(error => console.error("Error loading page:", error));
    }

    function renderTopWinnersChart() {
        const ctx = document.getElementById('topWinnersChart').getContext('2d');
        if (window.topWinnersChartInstance) {
            window.topWinnersChartInstance.destroy();
        }
        window.topWinnersChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: window.topWinnersData.labels,
                datasets: [{
                    label: 'Wins',
                    data: window.topWinnersData.wins,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    title: {
                        display: true,
                        text: 'Top 5 Winners'
                    }
                }
            }
        });
    }

    function renderTypeChart() {
        const ctx = document.getElementById('typeChart').getContext('2d');
    
        // Destroy the existing chart if it exists
        if (window.gameTypeChartInstance) {
            window.gameTypeChartInstance.destroy();
        }
    
        // Create the bar chart
        window.gameTypeChartInstance = new Chart(ctx, {
            type: 'bar', // Chart type
            data: {
                labels: window.gameTypeData.labels, // Labels for the chart
                datasets: [{
                    label: 'Number of Games',
                    data: window.gameTypeData.counts, // Data from Django
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)', // Tournament Game
                        'rgba(255, 99, 132, 0.2)', // Tournament Final
                        'rgba(54, 162, 235, 0.2)', // Tournament 3rd/4th Place
                        'rgba(255, 206, 86, 0.2)', // PVP
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, // Make the chart responsive
                scales: {
                    y: {
                        beginAtZero: true // Start the y-axis at 0
                    }
                },
                plugins: {
                    legend: { position: 'top' }, // Position of the legend
                    title: {
                        display: true, // Show the title
                        text: 'Game Type Distribution' // Title text
                    }
                }
            }
        });
    }

    function loadNavbar(url, additionalParam = null) {
        if (additionalParam) {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.append('language_code', additionalParam);
            url = urlObj.toString();
        }
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Extract the content from the response
                const newContent = tempDiv.querySelector('#navbarNav');
                if (newContent) {
                    document.getElementById('navbarNav').innerHTML = newContent.innerHTML;
                }

                checkAuth();
            })
            .catch(error => console.error("Error loading page:", error));
    }

    function attachFormEventListeners() {
        document.querySelectorAll('form').forEach(form => {
            form.removeEventListener('submit', handleFormSubmit); // Remove old listener to prevent duplicates
            form.addEventListener('submit', handleFormSubmit);  // Reattach new listener
        });
    }

    let gameStatsChart;

function renderChart(player1, player2) {
    const ctx = document.getElementById('gameStatsChart').getContext('2d');

    // Destroy the existing chart if it exists
    if (gameStatsChart) {
        gameStatsChart.destroy();
    }

    // Create a new chart
    gameStatsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['You Wins', 'Another Player Wins'],
            datasets: [{
                label: 'Game Statistics',
                data: [player1, player2],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)', // Green for wins
                    'rgba(255, 99, 132, 0.2)', // Red for losses
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderGameTypeChart() {
    const ctx = document.getElementById('gameTypeChart').getContext('2d');

    // Destroy the existing chart if it exists
    if (window.gameTypeChartInstance) {
        window.gameTypeChartInstance.destroy();
    }

    // Create the donut chart
    window.gameTypeChartInstance = new Chart(ctx, {
        type: 'doughnut', // Change to 'doughnut' for a donut chart
        data: {
            labels: window.gameTypeData.labels, // Labels for the chart
            datasets: [{
                label: 'Number of Games',
                data: window.gameTypeData.counts, // Data from Django
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)', // Tournament Game
                    'rgba(255, 99, 132, 0.2)', // Tournament Final
                    'rgba(54, 162, 235, 0.2)', // Tournament 3rd/4th Place
                    'rgba(255, 206, 86, 0.2)', // PVP
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, // Make the chart responsive
            cutout: '50%', // Add a cutout to create a donut chart
            plugins: {
                legend: { position: 'top' }, // Position of the legend
                title: {
                    display: true, // Show the title
                    text: 'Game Type Distribution' // Title text
                }
            }
        }
    });
}

function renderTournamentWinRateChart() {
    const ctx = document.getElementById('tournamentWinRateChart').getContext('2d');

    // Destroy the existing chart if it exists
    if (window.tournamentWinRateChartInstance) {
        window.tournamentWinRateChartInstance.destroy();
    }

    // Create the donut chart
    window.tournamentWinRateChartInstance = new Chart(ctx, {
        type: 'doughnut', // Change to 'doughnut' for a donut chart
        data: {
            labels: tournamentWinRateData.labels, // Labels for the chart
            datasets: [{
                data: tournamentWinRateData.data, // Data from Django
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)', // Tournaments Won
                    'rgba(255, 99, 132, 0.2)', // Tournaments Played
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, // Make the chart responsive
            cutout: '50%', // Add a cutout to create a donut chart
            plugins: {
                legend: { position: 'top' }, // Position of the legend
                title: {
                    display: true, // Show the title
                    text: 'Tournament Win Rate' // Title text
                }
            }
        }
    });
}

function renderWinLossChart() {
    const ctx = document.getElementById('winLossChart').getContext('2d');

    // Destroy the existing chart if it exists
    if (window.winLossChartInstance) {
        window.winLossChartInstance.destroy();
    }

    // Create the pie chart
    window.winLossChartInstance = new Chart(ctx, {
        type: 'pie', // Chart type
        data: {
            labels: ['Wins', 'Losses'], // Labels for the chart
            datasets: [{
                data: [window.playerStats.wins, window.playerStats.losses], // Data from Django
                backgroundColor: ['#36a2eb', '#ff6384'], // Colors for the segments
            }]
        },
        options: {
            responsive: true, // Make the chart responsive
            plugins: {
                legend: { position: 'top' }, // Position of the legend
                title: {
                    display: true, // Show the title
                    text: 'Win/Loss Distribution' // Title text
                }
            }
        }
    });
}

    function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    const form = event.target;
    const formData = new FormData(form);
    let csrfToken = getCSRFToken();

    if (!csrfToken) {
        console.error("CSRF token missing!");
        return;
    }

    fetch(form.action, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            if (data.html){
                document.getElementById('game_table').innerHTML = data.html;
                if (data.player_stats) {
                    const { player1, player2 } = data.player_stats;
                    renderChart(player1, player2); // Pass wins and losses to the chart
                }
            }
            if (data.redirect_url) {
                loadPage(data.redirect_url);
            }
        } else {
            alert(data.message || 'There was an error, please try again later.');
        }
    })
    .catch(error => console.error("Error submitting form", error));
}


    function joinTournament(tournamentId) {
        fetch(`/join_tournament/${tournamentId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    updateTournamentUI(data);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error("Error joining tournament:", error);
            });
    }
    
    function updateTournamentUI(data) {
        const playersList = document.getElementById('players-list');
        if (playersList) {
            const playerItem = document.createElement('li');
            playerItem.id = `player-${data.player_name}`;
            playerItem.innerHTML = `
                <span class="player-name">${data.player_name}</span>
                <img src="${data.player_avatar}" alt="${data.player_name}" class="avatar">
            `;
            playersList.appendChild(playerItem);
        }
    
        const playerCount = document.getElementById('player-count');
        if (playerCount) {
            playerCount.innerText = `Players: ${data.player_count}/4`;
        }
    }
        // Function to handle player login
    function loginPlayer(formId, endpoint, playerNumber) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(form);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            console.log('Form Data:', Object.fromEntries(formData));
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Response:', data);
                        alert(data.message);
                        updatePlayerProfile(playerNumber, data);
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    }

    $(document).on("change", "#language-select", function () {
        let selectedLanguage = this.value;
        let csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        console.log(selectedLanguage);
        fetch("/set_language/", {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest' // Indicate this is an AJAX request
            },
            body: new URLSearchParams({
                "language_code": selectedLanguage,
                "next": window.location.pathname
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success) {
                loadNavbar("/layout/", selectedLanguage)
                loadPage(data.redirect_url);
            } else {
                console.error("Language change failed.");
            }
        })
        .catch(error => console.error("Error:", error));
    });
    
    // Function to update player profile UI
    function updatePlayerProfile(data) {
        let playerNumber = data.player_number;
        const avatar = document.getElementById(`player${playerNumber}-avatar`);
        if (avatar) {
            avatar.src = data[`player${playerNumber}_avatar`];
        }
        const display_name = document.getElementById(`player${playerNumber}-display-name`);
        if (display_name) {
            display_name.innerHTML = `<strong>Display Name:</strong>${data[`player${playerNumber}_display_name`]}`;
        }
        const wins = document.getElementById(`player${playerNumber}-wins`);
        if (avatar) {
            wins.innerHTML = `<strong>Wins:</strong>${data[`player${playerNumber}_wins`]}`;
        }
        const losses = document.getElementById(`player${playerNumber}-losses`);
        if (losses) {
            losses.innerHTML = `<strong>Losses:</strong>${data[`player${playerNumber}_losses`]}`;
        }
        const id = document.getElementById(`player${playerNumber}-id`);
        if (id) {
            id.innerHTML = `<strong>ID:</strong>${data[`player${playerNumber}_id`]}`;
        }
    }
    

        // Function to handle display name updates
    function updateDisplayName(data) {
        let playerNumber = data.player_number;
        const display_name = document.getElementById(`player${playerNumber}-display-name`);
        if (display_name) {
            display_name.innerHTML = `<strong>Display Name:</strong> ${data.new_display_name}`;
        }
    }



        
document.addEventListener("DOMContentLoaded", function () {

    checkAuth();
    loadPage(window.location.pathname);
    attachFormEventListeners();


    const container = document.getElementById("content");

    document.querySelectorAll("a.nav-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const url = this.getAttribute("href").replace("#", ""); // Remove #
            loadPage(url);
        });
    });

    window.addEventListener("popstate", function (event) {
        if (event.state && event.state.path) {
            loadPage(event.state.path, false);
        }
    });

 
    
});
