(() => {
	// 悪い人にはこの2行は見えない
	var appkey = "0ept0ltrm98q2kr";
	var appsecret = "pgtr3kaiozis3zt";
	var dbx = false;

	function getURL (data) {
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

	function convertJSONToCSV (data) {
		ans = "";
		for (let i = 0; i < data.length; i++) {
			ans += data[i]["number"] + "," + data[i]["carrer"] + "," + data[i]["memo"] + "\n";
		}
		return ans
	}

	function convertCSVToJSON (csvStr) {
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

	async function saveData (data) {
		if (dbx) {
			dbx.filesUpload({
				path: "/data.json",
				mode: "overwrite",
				contents: JSON.stringify(data),
			});
		}
		localStorage.setItem("data", JSON.stringify(data));
	}

	async function saveHist (hist) {
		if (dbx) {
			dbx.filesUpload({
				path: "/hist.json",
				mode: "overwrite",
				contents: JSON.stringify(hist),
			});
		}
		localStorage.setItem("hist", JSON.stringify(hist));
	}

	async function loadData () {
		if (dbx) {
			var responce = await dbx.filesDownload({path: "/data.json"});
			return JSON.parse(await responce.result.fileBlob.text());
		}
		else {
			return JSON.parse(localStorage.getItem("data")) || [];
		}
	}

	async function loadHist () {
		if (dbx) {
			var responce = await dbx.filesDownload({path: "/hist.json"});
			return JSON.parse(await responce.result.fileBlob.text());
		}
		else {
			return JSON.parse(localStorage.getItem("hist")) || [];
		}
	}

	$("#get_access_code").on("click", async () => {
		var authorizeUrl = "https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=" + appkey;
		window.open(authorizeUrl);
	});

	$("#set_access_code").on("click", async () => {
		$("#set_access_code").attr("disabled", true);
		var access_code = $("#access_code").val();
		if (!access_code) return;
		console.log(access_code);
		$.ajax({
			type: "POST",
			url: "https://api.dropboxapi.com/1/oauth2/token",
			data: {
				"code": access_code,
				"grant_type": "authorization_code",
				"client_id": appkey,
				"client_secret": appsecret,
			},
			success: async (data) => {
				var jsonData = JSON.parse(data);
				// console.log(jsonData.access_token);
				// console.log(jsonData.token_type);
				// console.log(jsonData.uid);
				localStorage.setItem("access_token", jsonData.access_token);
				dbx = new Dropbox.Dropbox({accessToken: jsonData.access_token});
				let filename_list = [];
				for (let e of (await dbx.filesListFolder({path: ""})).result.entries) {
					filename_list.push(e.name);
				}
				if (!filename_list.includes("data.json")) {
					await saveData(JSON.parse(localStorage.getItem("data")));
				}
				if (!filename_list.includes("hist.json")) {
					await saveHist(JSON.parse(localStorage.getItem("hist")));
				}
				location.reload();
			}
		});
	});

	$("#direct_edit").on("click", () => {
		$("#textarea_data").attr("style", "");
		$("#textarea_data").val(convertJSONToCSV(JSON.parse(localStorage.getItem("data"))));
		$("#textarea_hist").attr("style", "");
		$("#textarea_hist").val(convertJSONToCSV(JSON.parse(localStorage.getItem("hist"))));
		$("#save").attr("style", "");

		$("#save").attr("style", "");
		$("#save").on("click", async () => {
			$("#save").attr("disabled", true);
			await saveData(convertCSVToJSON($("#textarea_data").val().trim()));
			await saveHist(convertCSVToJSON($("#textarea_hist").val().trim()));
			location.reload();
		});
	});

	async function onLoad () {
		var access_token = localStorage.getItem("access_token");
		if (access_token) dbx = new Dropbox.Dropbox({accessToken: access_token});
		var data = await loadData();
		var hist = await loadHist();

		var iframe = document.getElementById("iframe");
		iframe.src = getURL(data);

		// navigator on left
		for (let i = 0; i <= data.length; i++) {
			$("#tbody").append($("<tr>", {id: `tr${i}`}).append($("<td>").append($("<p>").append(
				$("<input>", {type: "button", id: `restore${i}`, value: "restore"}).on("click", async (e) => {
					$(e.target).attr("disabled", true);
					if (hist.length == 0) {
						data.splice(i, 0, {number: "00000", carrer: "190271", memo : "new"});
					}
					else {
						data.splice(i, 0, hist.shift());
						await saveHist(hist);
					}
					await saveData(data);
					location.reload();
				})
			).append(
				$("<br>")
			).append(
				$("<input>", {type: "button", id: `swap${i}`, value: `${i} ↔ ${i + 1}`}).on("click", async (e) => {
					$(e.target).attr("disabled", true);
					var l = data.length;
					if (i < 0 || i >= l) {
						alert("😜");
						return;
					}
					// swap https://blog.beatdjam.com/entry/2017/09/24/025854
					data[i - 1]=[data[i], data[i] = data[i - 1]][0];
					await saveData(data);
					location.reload();
				})
			).append(
				$("<br>")
			).append(
				$("<input>", {type: "button", id: `del${i}`, value: `del ${i+1}`}).on("click", async (e) => {
					$(e.target).attr("disabled", true);
					if (data[i]["number"] != "00000") {
						hist.splice(1, 0, data[i]);
						await saveHist(hist);
					}
					data.splice(i, 1);
					await saveData(data);
					location.reload();
				})
			))));

			if (i == 0 || i == data.length) $(`#swap${i}`).attr("disabled", true);
			if (i == data.length) $(`#del${i}`).attr("disabled", true);

			if (i == data.length) {
				$(`#tr${i}`).append($("<td>")).append($("<td>"));
				break;
			}

			$(`#tr${i}`).append($("<td>").append($("<p>")
				.append($("<div>").text("memo"))
				.append($("<div>").text("num"))
				.append($("<div>").text("carrer"))));

			$(`#tr${i}`).append($("<td>").append($("<p>").append(
				$("<input>", {type: "text", value: data[i]["memo"]}).on("change", async (e) => {
					data[i]["memo"] = e.target.value;
					await saveData(data);
				})
			).append(
				$("<input>", {type: "text", value: data[i]["number"]}).on("change", async (e) => {
					data[i]["number"] = e.target.value;
					await saveData(data);
					$('#iframe')[0].contentWindow.location.replace(getURL(data));
				})
			).append(
				$("<input>", {type: "text", value: data[i]["carrer"]}).on("change", async (e) => {
					data[i]["carrer"] = e.target.value;
					await saveData(data);
					$('#iframe')[0].contentWindow.location.replace(getURL(data));
				})
			)));
		}
	}
	onLoad();
})();
