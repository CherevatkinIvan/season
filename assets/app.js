let receiveMessage = (event) => {
    switch (event.data.message) {
        case 'instance':
            initialize(event.data.value)
            break
        case 'check':
            checkAnswers()
            break
    }
}

let rowsTable = [
    { name: "Январь", image: "", correctColumn: "Зима" },
    { name: "Февраль", image: "", correctColumn: "Зима" },
    { name: "Март", image: "", correctColumn: "Весна" },
    { name: "Апрель", image: "", correctColumn: "Весна" },
    { name: "Май", image: "", correctColumn: "Весна" },
    { name: "Июнь", image: "", correctColumn: "Лето" },
    { name: "Июль", image: "", correctColumn: "Лето" },
    { name: "Август", image: "", correctColumn: "Лето" },
    { name: "Сентябрь", image: "", correctColumn: "Осень" },
    { name: "Октябрь", image: "", correctColumn: "Осень" },
    { name: "Ноябрь", image: "", correctColumn: "Осень" },
    { name: "Декабрь", image: "", correctColumn: "Зима" }
];

let columnsTable = [
    { name: "Зима", image: "./src/winter.png" },
    { name: "Весна", image: "./src/spring.png" },
    { name: "Лето", image: "./src/summer.png" },
    { name: "Осень", image: "./src/autumn.png" },
];

let minRowsCount = 3;
let maxRowsCount = 5;

let tableBody;

let columnHasNameAndImage;
let columnHasOnlyName;
let columnHasOnlyImage;

let rowHasNameAndImage;
let rowHasOnlyName;
let rowHasOnlyImage;

document.addEventListener("DOMContentLoaded", () => {
    tableBody = document.getElementById("table-body");
    //initialize()
});

function initialize(params) {
    if (params) {
        rowsTable = params.rows;
        columnsTable = params.columns;
        minRowsCount = params.minRowsCount;
        maxRowsCount = params.maxRowsCount;
    };

    rowHasNameAndImage = rowsTable[0].image && rowsTable[0].image.length > 0 && rowsTable[0].name && rowsTable[0].name.length > 0;
    rowHasOnlyName = !rowHasNameAndImage && rowsTable[0].name && rowsTable[0].name.length > 0;
    rowHasOnlyImage = !rowHasNameAndImage && !rowHasOnlyName;

    columnHasNameAndImage = columnsTable[0].image && columnsTable[0].image.length > 0 && columnsTable[0].name && columnsTable[0].name.length > 0;
    columnHasOnlyName = !columnHasNameAndImage && columnsTable[0].name && columnsTable[0].name.length > 0;
    columnHasOnlyImage = !columnHasNameAndImage && !columnHasOnlyName;

    createTableHead();
    compileTableIcons();

    tableBody.innerHTML = "";
    const rowCount = getRandomInt(minRowsCount, maxRowsCount);
    const selectedRows = getRandomRows(rowCount);

    selectedRows.forEach(rowData => {
        const row = createTableRow(rowData);
        tableBody.insertAdjacentElement("beforeend", row);
    });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomRows(count) {
    const shuffledRows = [...rowsTable].sort(() => 0.5 - Math.random());
    return shuffledRows.slice(0, count);
}

function createTableHead() {
    const tableHead = document.getElementById("table-head");
    const headRow = document.createElement("tr");

    headRow.innerHTML = `<th></th>`
    columnsTable.forEach((column) => {
        if (columnHasNameAndImage) {
            headRow
                .insertAdjacentHTML("beforeend", `<th><img src=${column.image} alt="Image ${column.name}" />${column.name}</th>`);
        } else if (columnHasOnlyImage) {
            headRow
                .insertAdjacentHTML("beforeend", `<th><img src=${column.image} alt="Image ${column.image}" /></th>`);
        } else if (columnHasOnlyName) {
            headRow
                .insertAdjacentHTML("beforeend", `<th>${column.name}</th>`);
        }
    });

    tableHead.insertAdjacentElement("beforeend", headRow);
}

function compileTableIcons() {
    for (const icolumn in columnsTable) {
        const column = columnsTable[icolumn]
        if (column.tick) {
            document.styleSheets[0].insertRule(`
                .radio-check:nth-of-type(${2 + parseInt(icolumn)}) input:checked+.checkmark {
                    background-image: url(${column.tick});
                }
            `, document.styleSheets[0].cssRules.length);
        }
    }
}

function createTableRow(rowData) {
    const row = document.createElement("tr");

    if (rowHasNameAndImage) {
        row.innerHTML = `<td><img src=${rowData.image} alt="Image ${rowData.name}" />${rowData.name}</td>`;
    } else if (rowHasOnlyImage) {
        row.innerHTML = `<td><img src=${rowData.image} alt="Image ${rowData.image}" /></td>`;
    } else if (rowHasOnlyName) {
        row.innerHTML = `<td>${rowData.name}</td>`;
    }

    columnsTable.forEach((column) => {
        if (rowHasOnlyImage) {
            row
                .insertAdjacentHTML("beforeend", `
                    <td class="radio-check">
                        <input type="radio" name="${rowData.image}" value="${column.image}">
                        <span class="checkmark"></span>
                    </td>`);
        } else {
            row
                .insertAdjacentHTML("beforeend", `
                    <td class="radio-check">
                        <input type="radio" name="${rowData.name}" value="${column.name}">
                        <span class="checkmark"></span>
                    </td>`);
        }
    });

    return row;
}

function checkAnswers() {
    const answers = [];
    let correctCount = 0;
    const rows = document.querySelectorAll("#table-body tr");

    rows.forEach(row => {
        const rowNameOrImage = row.querySelector('input').getAttribute('name');
        const rowData = !rowHasOnlyImage
            ? rowsTable.find((row) => row.name === rowNameOrImage)
            : rowsTable.find((row) => row.image === rowNameOrImage);
        const correctAnswer = rowData.correctColumn;

        const selectedOption = row.querySelector(`input[name="${rowNameOrImage}"]:checked`);

        let answer;
        if (!selectedOption) {
            if (rowHasOnlyName) {
                answer = {
                    task: rowData.name,
                    correctAnswer,
                    userAnswer: "",
                    isRight: false
                }
            } else {
                answer = {
                    task: rowData.name,
                    src: rowData.image,
                    correctAnswer,
                    userAnswer: "",
                    isRight: false
                }
            }
            answers.push(answer);
            return;
        }

        const selectedColumn = !rowHasOnlyImage
            ? columnsTable.find((column) => column.name === selectedOption.value)
            : columnsTable.find((column) => column.image === selectedOption.value);

        if (rowHasOnlyName) {
            answer = {
                task: rowData.name,
                correctAnswer,
                userAnswer: selectedColumn.name,
                isRight: false
            }
        } else {
            answer = {
                task: rowData.name,
                src: rowData.image,
                correctAnswer,
                userAnswer: selectedColumn.name,
                isRight: false
            }
        }

        if (selectedColumn.name === correctAnswer) {
            correctCount++;
            answer.isRight = true;
        }
        answers.push(answer);
    });

    window.parent.postMessage({ message: "finish", value: { score: correctCount, answers } }, "*")
}

window.onload = () => {
    window.addEventListener("message", receiveMessage);
    window.parent.postMessage({ message: "load" }, "*")
}

const table = document.getElementById('tbl');

  function validateTable() {
    var check = 0;
    var fackt = 0;
    table.querySelectorAll('tbody tr').forEach(row => {
        fackt++;
      const radios = row.querySelectorAll('input[type="radio"]');
      if (radios.length > 0) {
        const anyChecked = Array.from(radios).some(r => r.checked);
        if (anyChecked) {
            check++;
        }
      }
    });
    el = document.getElementById('complete-task');
    
    if((check === fackt) && check !== 0){
        window.parent.postMessage({ message: "check", value: { enabled: true } }, "*")
    }
    
  }

  table.addEventListener('change', function (e) {
    if (e.target && e.target.type === 'radio') {
      validateTable();
    }
  });