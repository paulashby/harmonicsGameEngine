(function($){

    exportTableToCSV = function ($table, filename) {

    var $rows = $table.find('tr:has(td),tr:has(th)'),

        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row), $cols = $row.find('td,th');

            if( ! $row.parent().is('tfoot') ) {
                return $cols.map(function (j, col) {
                    var $col = $(col), text = $col.text();

                    text = text.replace('Show more details','');

                    if( ! $col.hasClass('check-column') ) {
                        return text.replace(/"/g, '""'); // escape double quotes    
                    }                    

                }).get().join(tmpColDelim);

            }
        }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

        // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);        
        console.log(csv);        

        $(this).attr({ 'download': filename, 'href': csvData, 'target': '_blank' });  

    }
})(jQuery);