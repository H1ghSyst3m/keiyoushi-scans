// Declare global variables to hold the current and filtered data, and the current sorting state.
let currentData = [];
let filteredData = [];
let currentSort = { column: null, ascending: true };

// Add an event listener for the DOMContentLoaded event to initialize the script once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', function() {
    const url = 'virus_total_results.json?t=' + new Date().getTime();
    // Fetch data from a JSON file and initialize the application with this data.
    fetch(url)
        .then(response => response.json())
        .then(data => {
            currentData = data; // Store the fetched data in currentData.
            filteredData = data; // Initially, filteredData is the same as currentData.
            displaySummary(data); // Display summary information based on the fetched data.
            applyFilterAndSort(); // Apply filters and sorting to the data.
            addSortingEventListeners(); // Setup event listeners for table sorting.
            initializeSelect2(); // Initialize the Select2 component for language filtering.
        });
});

// Function to display summary information in the 'summary-container' element.
function displaySummary(data) {
    // Calculate the total number of items and the number of items with viruses.
    const totalItems = data.length;
    const totalViruses = data.reduce((count, item) => count + (item.positives > 0 ? 1 : 0), 0);
    // Update the innerHTML of the 'summary-container' with the summary information.
    document.getElementById('summary-container').innerHTML = `
        <p>Total number of scanned extensions: ${totalItems}</p>
        <p>Number of viruses found: <b>${totalViruses}</b></p>
    `;
}

// Function to initialize the Select2 component for language filtering.
function initializeSelect2() {
    $('.language-filter').select2({
        placeholder: "Select a language",
        allowClear: true
    }).on('change', function() {
        applyFilterAndSort(); // Apply filters and sorting when the selection changes.
    });
}

// Function to apply filters and sorting to the data.
function applyFilterAndSort() {
    // Retrieve selected languages from the Select2 component.
    const selectedLanguages = $('.language-filter').val();
    filteredData = currentData;
    // Filter data based on selected languages.
    if (selectedLanguages && selectedLanguages.length > 0 && !selectedLanguages.includes("")) {
        filteredData = filteredData.filter(item => {
            const languageCode = item.filename.split('-')[1].split('.')[0];
            return selectedLanguages.includes(languageCode) || (selectedLanguages.includes('all') && languageCode === 'all');
        });
    }

    // Sort the filtered data if a sorting column is defined.
    if (currentSort.column) {
        filteredData = sortData(filteredData, currentSort.column, currentSort.ascending);
    }

    // Create table rows with the filtered and sorted data.
    createTableRows(filteredData);
}

// Function to add event listeners to table headers for sorting functionality.
function addSortingEventListeners() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            const isAscending = (sortKey === currentSort.column) ? !currentSort.ascending : true;
            currentSort = { column: sortKey, ascending: isAscending };
            updateSortSymbols(headers, sortKey, isAscending); // Update sort symbols in the headers.
            applyFilterAndSort(); // Re-apply filters and sorting with the new sort order.
        });
    });
}

// Function to update sorting symbols (arrows) in the table headers.
function updateSortSymbols(headers, activeSortKey, ascending) {
    headers.forEach(header => {
        const sortSymbol = header.querySelector('.sort-symbol');
        if (header.getAttribute('data-sort') === activeSortKey) {
            sortSymbol.textContent = ascending ? '↓' : '↑';
        } else {
            sortSymbol.textContent = '';
        }
    });
}

// Function to sort the data based on the specified column and order (ascending or descending).
function sortData(data, column, ascending) {
    return data.sort((a, b) => {
        if (column === 'file_size' || column === 'scan_date' || column === 'positives' || column === 'total') {
            return ascending ? a[column] - b[column] : b[column] - a[column];
        }
        return ascending ? a[column].localeCompare(b[column]) : b[column].localeCompare(a[column]);
    });
}

// Function to create and append table rows based on the provided data.
function createTableRows(data) {
    const list = document.getElementById('data-list');
    list.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.filename}</td>
            <td><input type="text" value="${item.hash}" class="form-control read-only-input" readonly></td>
            <td>${new Date(item.scan_date * 1000).toLocaleDateString()}</td>
            <td>${item.positives}</td>
            <td>${item.total}</td>
            <td>${item.file_type}</td>
            <td>${(item.file_size / 1024).toFixed(2)} KB</td>
            <td><a href="${item.link}" class="btn btn-primary" target="_blank">Details</a></td>
        `;
        list.appendChild(row); // Append the new row to the table.
    });
}
