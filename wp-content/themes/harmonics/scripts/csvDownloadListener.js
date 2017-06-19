window.onload = function () {
    var bttns = document.getElementsByClassName('download-csv'),
    exportTable = function (e) {        
        var table = jQuery('.userloginhistories');
        // e.preventDefault(); 
        exportTableToCSV.apply(this, [table, 'user_login_export.csv']);
    };

    Array.from(bttns).forEach(function(element) {
      $element = jQuery(element);
      $element.on('click', exportTable);        
    });  
};