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

	function getCSV (data) {
		ans = "";
		for (let i = 0; i < data.length; i++) {
			ans += data[i]["number"] + "," + data[i]["carrer"] + "," + data[i]["memo"] + "\n";
		}
		return ans
	}

	function getJSON (csvStr) {
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

	document.getElementById("get_access_code").onclick = function () {
		var authorizeUrl = "https://www.dropbox.com/1/oauth2/authorize?response_type=code&client_id=" + appkey;
		window.open(authorizeUrl);
	}

	document.getElementById("set_access_code").onclick = function () {
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
			success: function(data){
				var jsonData = JSON.parse(data);
				// console.log(jsonData.access_token);
				// console.log(jsonData.token_type);
				// console.log(jsonData.uid);
				localStorage.setItem("access_token", jsonData.access_token);
			}
		});
	}

	$("#direct_edit").on("click", () => {
		$("#textarea_data").attr("style", "");
		$("#textarea_data").val(getCSV(JSON.parse(localStorage.getItem("data"))));
		$("#textarea_his").attr("style", "");
		$("#textarea_his").val(getCSV(JSON.parse(localStorage.getItem("his"))));

		$("#save").attr("style", "");
		$("#save").on("click", () => {
			localStorage.setItem("data", JSON.stringify(getJSON($("#textarea_data").val().trim())));
			location.reload();
		});
	});

	function onLoad () {
		data = JSON.parse(localStorage.getItem("data")) || [];
		// console.log(data);
		// console.log(JSON.parse(localStorage.getItem("his")) || []);

		var iframe = document.getElementById("iframe");
		iframe.src = getURL(data);

		// navigator on left
		for (let i = 0; i <= data.length; i++) {
			$("#tbody").append($("<tr>", {id: `tr${i}`}).append($("<td>").append($("<p>").append(
				$("<input>", {type: "button", id: `restore${i}`, value: "restore"}).on("click", () => {
					his = JSON.parse(localStorage.getItem("his"));
					if (his.length == 0) {
						data.splice(i, 0, {number: "00000", carrer: "190271", memo : "new"});
					}
					else {
						data.splice(i, 0, his.shift());
						localStorage.setItem("his", JSON.stringify(his));
					}
					localStorage.setItem("data", JSON.stringify(data));
					location.reload();
				})
			).append(
				$("<br>")
			).append(
				$("<input>", {type: "button", id: `swap${i}`, value: `${i} ↔ ${i + 1}`}).on("click", () => {
					var l = data.length;
					if (i < 0 || i >= l) {
						alert("😜");
						return;
					}
					// swap https://blog.beatdjam.com/entry/2017/09/24/025854
					data[i - 1]=[data[i], data[i] = data[i - 1]][0];
					localStorage.setItem("data", JSON.stringify(data));
					location.reload();
				})
			).append(
				$("<br>")
			).append(
				$("<input>", {type: "button", id: `del${i}`, value: `del ${i+1}`}).on("click", () => {
					his = JSON.parse(localStorage.getItem("his")) || [];
					if (data[i]["number"] != "00000") {
						his.splice(1, 0, data[i]);
						localStorage.setItem("his", JSON.stringify(his));
					}
					data.splice(i, 1);
					localStorage.setItem("data", JSON.stringify(data));
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
				$("<input>", {type: "text", value: data[i]["memo"]}).on("change", (e) => {
					data[i]["memo"] = e.target.value;
					localStorage.setItem("data", JSON.stringify(data));
				})
			).append(
				$("<input>", {type: "text", value: data[i]["number"]}).on("change", (e) => {
					data[i]["number"] = e.target.value;
					localStorage.setItem("data", JSON.stringify(data));
					$('#iframe')[0].contentWindow.location.replace(getURL(data));
				})
			).append(
				$("<input>", {type: "text", value: data[i]["carrer"]}).on("change", (e) => {
					data[i]["carrer"] = e.target.value;
					localStorage.setItem("data", JSON.stringify(data));
					$('#iframe')[0].contentWindow.location.replace(getURL(data));
				})
			)));
		}
	}
	onLoad();
})();
