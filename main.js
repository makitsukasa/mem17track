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
			await dbx.filesUpload({
				path: "/data.json",
				mode: "overwrite",
				contents: JSON.stringify(data),
			});
		}
		localStorage.setItem("data", JSON.stringify(data));
	}

	async function saveHis (his) {
		if (dbx) {
			await dbx.filesUpload({
				path: "/his.json",
				mode: "overwrite",
				contents: JSON.stringify(his),
			});
		}
		localStorage.setItem("his", JSON.stringify(his));
	}

	async function loadData () {
		if (dbx) {
			var responce = await dbx.filesDownload({path: "/data.json"});
			console.log(await responce.result.fileBlob.text());
			return JSON.parse(await responce.result.fileBlob.text());
		}
		else {
			return JSON.parse(localStorage.getItem("data"));
		}
	}

	async function loadHis () {
		if (dbx) {
			var responce = await dbx.filesDownload({path: "/his.json"});
			return JSON.parse(await responce.result.fileBlob.text());
		}
		else {
			return JSON.parse(localStorage.getItem("his"));
		}
	}

	document.getElementById("get_access_code").onclick = async () => {
		var authorizeUrl = "https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=" + appkey;
		window.open(authorizeUrl);
	}

	document.getElementById("set_access_code").onclick = async () => {
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
				if (!filename_list.includes("his.json")) {
					await saveHis(JSON.parse(localStorage.getItem("his")));
				}
				location.reload();
			}
		});
	}

	$("#direct_edit").on("click", () => {
		$("#textarea_data").attr("style", "");
		$("#textarea_data").val(convertJSONToCSV(JSON.parse(localStorage.getItem("data"))));
		$("#textarea_his").attr("style", "");
		$("#textarea_his").val(convertJSONToCSV(JSON.parse(localStorage.getItem("his"))));

		$("#save").attr("style", "");
		$("#save").on("click", async () => {
			await saveData(convertCSVToJSON($("#textarea_data").val().trim()));
			location.reload();
		});
	});

	async function onLoad () {
		var access_token = localStorage.getItem("access_token");
		if (access_token) dbx = new Dropbox.Dropbox({accessToken: access_token});
		var data = await loadData();
		var his = await loadHis();

		var iframe = document.getElementById("iframe");
		iframe.src = getURL(data);

		// navigator on left
		for (let i = 0; i <= data.length; i++) {
			$("#tbody").append($("<tr>", {id: `tr${i}`}).append($("<td>").append($("<p>").append(
				$("<input>", {type: "button", id: `restore${i}`, value: "restore"}).on("click", async () => {
					if (his.length == 0) {
						data.splice(i, 0, {number: "00000", carrer: "190271", memo : "new"});
					}
					else {
						data.splice(i, 0, his.shift());
						await saveHis(his);
					}
					await saveData(data);
					location.reload();
				})
			).append(
				$("<br>")
			).append(
				$("<input>", {type: "button", id: `swap${i}`, value: `${i} ↔ ${i + 1}`}).on("click", async () => {
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
				$("<input>", {type: "button", id: `del${i}`, value: `del ${i+1}`}).on("click", async () => {
					if (data[i]["number"] != "00000") {
						his.splice(1, 0, data[i]);
						await saveHis(his);
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
