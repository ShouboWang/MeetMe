$( document ).ready(function() {
	$("#signInBtn").click(function(){
		$('#signInModal').modal();
	});

	$("#logInBtn").click(function(){
		setTimeout(function(){ 

			$(location).attr('href', 'dashboard.html');

		}, 500);
	});
});