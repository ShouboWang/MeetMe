$( document ).ready(function() {
	$("#signInBtn").click(function(){
		$('#signInModal').modal();
	});

	$("#joinNowBtn").click(function(){
		$("#registerModal").modal();
	})

	$("#logInBtn").click(function(){
		var login = $("#loginEmail").val();
		var password = $("#loginPassword").val();
		var obj = {
			login : login,
			password : password
		};
		$.ajax({
	        url: 'http://localhost:8080/login',
	        // dataType: "jsonp",
	        data: JSON.stringify(obj),
	        type: 'POST',
	        contentType:"application/json",
	       // jsonpCallback: 'callback', // this is not relevant to the POST anymore
	        success: function (data) {
	        	if(data.success){
	        		$(location).attr("href", "dashboard.html");
	        	}else{
	        		alert("Login failed!");
	        	}
	        },
	        error: function (xhr, status, error) {
	        	alert("Login failed!");
	        },
    	});
	});

	$("#regBtn").click(function(){
		var name = $("#egName").val();
		var login = $("#regEmail").val();
		var password = $("#regPassword").val();
		var obj = {
			login : login,
			password : password,
			name : name
		};
		$.ajax({
	        url: 'http://localhost:8080/register',
	        // dataType: "jsonp",
	        data: JSON.stringify(obj),
	        type: 'POST',
	        contentType:"application/json",
	       // jsonpCallback: 'callback', // this is not relevant to the POST anymore
	        success: function (data) {
	        	if(data.success){
	        		$(location).attr("href", "dashboard.html");
	        	}else{
	        		alert("Register failed!");
	        	}
	        },
	        error: function (xhr, status, error) {
	        	alert("Register failed!");
	        },
    	});
	});
});