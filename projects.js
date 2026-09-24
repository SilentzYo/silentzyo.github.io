(function () {
    var grid = document.querySelector('.projects-grid');
    if (!grid) {
        return;
    }

    var projects = Array.prototype.slice.call(grid.querySelectorAll('.project'));
    var currentCount = 0;

    function columnCount() {
        return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    }

    function layout() {
        var count = columnCount();
        if (count === currentCount) {
            return;
        }
        currentCount = count;

        var columns = [];
        for (var i = 0; i < count; i++) {
            var column = document.createElement('div');
            column.className = 'projects-column';
            columns.push(column);
        }

        projects.forEach(function (project, index) {
            columns[index % count].appendChild(project);
        });

        grid.replaceChildren.apply(grid, columns);
    }

    layout();
    window.addEventListener('resize', layout);
})();
