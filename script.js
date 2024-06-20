$(document).ready(function() {
    $.fn.dataTable.moment('DD-MM-YYYY');

    $('#languageFilter').select2();

    var table = $('#virusTable').DataTable({
        columns: [
            { data: 'filename', title: 'Filename' },
            { data: 'hash', title: 'Hash', render: function(data, type, row) {
                return `<input type="text" value="${data}" readonly style="border:none; background:transparent; width:150px;" title="${data}" />`;
            }},
            { data: 'scan_date', title: 'Scan Date', render: function(data, type, row) {
                return moment.unix(data).format('DD-MM-YYYY');
            }},
            { data: 'positives', title: 'Positives' },
            { data: 'total', title: 'Total' },
            { data: 'file_size', title: 'File Size (KB)', render: function(data, type, row) {
                return (data / 1024).toFixed(2);
            }, type: 'num' },
            { data: 'link', title: 'Details', render: function(data, type, row) {
                return `<a href="${data}" target="_blank" class="details-btn">Details</a>`;
            }}
        ],
        order: [[2, 'desc']],
        columnDefs: [
            { type: 'num', targets: 5 },
        ],
        autoWidth: false,
        createdRow: function(row, data, dataIndex) {
            $('td', row).each(function(index, td) {
                $(td).attr('data-label', table.column(index).header().innerText);
            });
        }
    });

    function fetchDataAndUpdateTable() {
        $.getJSON('virus_total_results.json', function(data) {
            var groupedData = groupByFilename(data);
            var tableData = formatData(groupedData);
            table.clear().rows.add(tableData).draw();
            updateTotalPositives(tableData);
            disableTextSelection();
        });
    }

    fetchDataAndUpdateTable();

    setInterval(fetchDataAndUpdateTable, 30000);

    function groupByFilename(data) {
        return data.reduce(function(acc, item) {
            var baseName = item.filename.split('-v')[0];
            if (!acc[baseName]) {
                acc[baseName] = [];
            }
            acc[baseName].push(item);
            return acc;
        }, {});
    }

    function formatData(groupedData) {
        var result = [];
        for (var key in groupedData) {
            groupedData[key].forEach(function(item) {
                result.push(item);
            });
        }
        return result;
    }

    function disableTextSelection() {
        $('.dataTables_paginate .paginate_button').css('user-select', 'none');
    }

    function updateTotalPositives(data) {
        var totalPositives = data.reduce(function(sum, item) {
            return sum + item.positives;
        }, 0);
        $('#totalPositives').text(totalPositives);
    }

    $('#languageFilter').on('change', function() {
        var selectedLanguages = $(this).val();
        if (selectedLanguages.length === 0 || selectedLanguages.includes('all')) {
            table.column(0).search('').draw();
        } else {
            var searchRegex = selectedLanguages.map(function(lang) {
                return '\\b' + lang + '\\b';
            }).join('|');
            table.column(0).search(searchRegex, true, false).draw();
        }
    });

    $('#sortOptions').on('change', function() {
        var sortOption = $(this).val();
        var columnIdx, sortDir;

        switch (sortOption) {
            case 'filename-asc':
                columnIdx = 0; sortDir = 'asc';
                break;
            case 'filename-desc':
                columnIdx = 0; sortDir = 'desc';
                break;
            case 'date-asc':
                columnIdx = 2; sortDir = 'asc';
                break;
            case 'date-desc':
                columnIdx = 2; sortDir = 'desc';
                break;
            case 'positives-asc':
                columnIdx = 3; sortDir = 'asc';
                break;
            case 'positives-desc':
                columnIdx = 3; sortDir = 'desc';
                break;
            case 'size-asc':
                columnIdx = 5; sortDir = 'asc';
                break;
            case 'size-desc':
                columnIdx = 5; sortDir = 'desc';
                break;
            default:
                return;
        }

        table.order([columnIdx, sortDir]).draw();
    });

    table.on('order.dt', function() {
        table.columns().every(function() {
            this.nodes().flatten().to$().removeClass('sorted');
        });
        var order = table.order()[0];
        table.column(order[0]).nodes().flatten().to$().addClass('sorted');
    });
});
