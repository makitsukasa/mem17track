function getURL(data) {
	var url = "https://t.17track.net/en#nums=";
	for (let i = 0; i < data.length; i++) {
		if (i == 0) url += data[i]["number"];
		else url += "," + data[i]["number"];
	}
	url += "&fc=";
	for (let i = 0; i < data.length; i++) {
		if (i == 0) url += data[i]["carrer"];
		else url += "," + data[i]["carrer"];
	}
	return url;
}

function onChange(data, i, key, value){
	console.log(data, i, key, value);
	data[i][key] = value;
	localStorage.setItem("data", JSON.stringify(data));
	document.getElementById('iframe').contentWindow.location.replace(getURL(data));
}

function removeData(data, i) {
	his = JSON.parse(localStorage.getItem("his")) || [];
	if (data[i]["number"] != "00000") {
		his.splice(1, 0, data[i]);
		localStorage.setItem("his", JSON.stringify(his));
	}
	data.splice(i, 1);
	localStorage.setItem("data", JSON.stringify(data));
	location.reload();
}

function restoreData(data, i) {
	his = JSON.parse(localStorage.getItem("his"));
	if (his.length == 0) {
		data.splice(i, 0, {
			number: "00000",
			carrer: "190271",
			memo  : "new"
		});
	}
	else {
		data.splice(i, 0, his[0]);
		his.splice(0, 1);
		localStorage.setItem("his", JSON.stringify(his));
	}
	localStorage.setItem("data", JSON.stringify(data));
	location.reload();
}

function swapData(data, x, y) {
	var l = data.length;
	if (x < 0 || x >= l || y < 0 || y >= l) {
		alert("😜");
		return;
	}
	// swap https://blog.beatdjam.com/entry/2017/09/24/025854
	data[x]=[data[y], data[y] = data[x]][0];
	localStorage.setItem("data", JSON.stringify(data));
	location.reload();
}

function getCSV(data) {
	ans = "";
	for (let i = 0; i < data.length; i++) {
		ans += data[i]["number"] + "," + data[i]["carrer"] + "," + data[i]["memo"] + "\n";
	}
	return ans
}

function getJSON(csvStr) {
	if (csvStr == "") return "";
	const ans = [];
	const data = csvStr.split("\n");
	for (let i = 0; i < data.length; i++) {
		d = data[i].split(",");
		ans[i] = {
			"number": d[0],
			"carrer": d[1],
			"memo": d[2],
		};
	}
	return ans;
}

function saveEditedData() {
	var elem = document.getElementById("textarea_data");
	localStorage.setItem("data", JSON.stringify(getJSON(elem.value.trim())));
	elem = document.getElementById("textarea_his");
	localStorage.setItem("his", JSON.stringify(getJSON(elem.value.trim())));
	location.reload();
}

function editData() {
	data = JSON.parse(localStorage.getItem("data"));
	his = JSON.parse(localStorage.getItem("his"));
	console.log(data);

	var elem = document.getElementById("textarea_data");
	elem.setAttribute("style", "");
	elem.value = getCSV(data);

	elem = document.getElementById("textarea_his");
	elem.setAttribute("style", "");
	elem.value = getCSV(his);

	elem = document.createElement("input");
	elem.setAttribute("type", "button");
	elem.setAttribute("value", "save");
	elem.setAttribute("onclick", `saveEditedData();`);
	parent = document.getElementById("textarea");
	parent.appendChild(elem);
}

function onLoad() {
	data = JSON.parse(localStorage.getItem("data")) || [];
	console.log(data);
	console.log(JSON.parse(localStorage.getItem("his")) || []);

	var iframe = document.getElementById("iframe");
	iframe.src = getURL(data);

	// navigator on left
	var tbody = document.getElementById("tbody");
	var tr, td, p, button, text;
	for (let i = 0; i <= data.length; i++) {
		tr = document.createElement("tr");

		td = document.createElement("td");
		p = document.createElement("p");
		button = document.createElement("input");
		button.setAttribute("type", "button");
		button.setAttribute("value", "restore");
		button.setAttribute("onclick", `restoreData(data, ${i});`);
		p.appendChild(button);
		p.appendChild(document.createElement("br"));
		button = document.createElement("input");
		button.setAttribute("type", "button");
		button.setAttribute("value", `${i} ↔ ${i + 1}`);
		button.setAttribute("onclick", `swapData(data, ${i-1}, ${i});`);
		if (i == 0 || i == data.length) button.setAttribute("disabled", true);
		p.appendChild(button);
		p.appendChild(document.createElement("br"));
		button = document.createElement("input");
		button.setAttribute("type", "button");
		button.setAttribute("value", `del ${i+1}`);
		button.setAttribute("onclick", `removeData(data, ${i});`);
		if (i == data.length) button.setAttribute("disabled", true);
		p.appendChild(button);
		td.appendChild(p);
		tr.appendChild(td);

		if (i == data.length) {
			td = document.createElement("td");
			tr.appendChild(td);
			td = document.createElement("td");
			tr.appendChild(td);
			tbody.appendChild(tr);
			break;
		}

		td = document.createElement("td");
		p = document.createElement("p");
		p.appendChild(document.createTextNode("memo"));
		p.appendChild(document.createElement("br"));
		p.appendChild(document.createTextNode("number"));
		p.appendChild(document.createElement("br"));
		p.appendChild(document.createTextNode("carrer"));
		td.appendChild(p);
		tr.appendChild(td);

		td = document.createElement("td");
		p = document.createElement("p");
		text = document.createElement("input");
		text.setAttribute("type", "text");
		text.setAttribute("value", data[i]["memo"]);
		text.addEventListener('change', function(event){onChange(data, i, "memo", event.target.value)});
		p.appendChild(text);
		p.appendChild(document.createElement("br"));
		text = document.createElement("input");
		text.setAttribute("type", "text");
		text.setAttribute("value", data[i]["number"]);
		text.addEventListener('change', function(event){onChange(data, i, "number", event.target.value)});
		p.appendChild(text);
		p.appendChild(document.createElement("br"));
		text = document.createElement("input");
		text.setAttribute("type", "text");
		text.setAttribute("value", data[i]["carrer"]);
		text.addEventListener('change', function(event){onChange(data, i, "carrer", event.target.value)});
		p.appendChild(text);
		td.appendChild(p);
		tr.appendChild(td);

		tbody.appendChild(tr);
	}
}

onLoad();
