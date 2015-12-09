$( document ).ready(function() {
	$.ajax({
	    url: 'http://localhost:8080/getUserList',
	        // dataType: "jsonp",
	    data: JSON.stringify({}),
	    type: 'POST',
	    contentType:"application/json",
	    // jsonpCallback: 'callback', // this is not relevant to the POST anymore
	    success: function (data) {
	    	var options = '';
	    	$.each(data, function(index, value){
	    		options += '<option value="' + value.email + '">' + value.name + '</option>';
	    	});
	    	console.log(options);
	    	$("#mustAttSelect").empty().append(options);
	    	$("#mayAttSelect").empty().append(options);
	    	$("#mustAttSelect").select2({ width: '98%' });  
			$("#mayAttSelect").select2({ width: '98%' });  
	    },
	    error: function (xhr, status, error) {
	          	
	    },
    });
	var emailList = [];
	$('.date').datepicker({
		multidate: true,
		startDate: '+0d'
	});
	    
	$('.timeDropdown').on("click", function(){
		var value = $(this).data("select");
		var text = $(this).text();
		when = text;
		$("#timeText").data("select", value);
		$("#timeBtn").html(text + ' <span class="caret"></span>');
	});


	$("#customGroupBtn").click(function(){
		$('#newGroupModal').modal();
	});

	$("#createNewGroups").click(function(){
		$("#newGroupModal").modal("hide");
		var groupname = $("#groupName").val();
		var mustAttend = $("#mustattendNum").val();
		var count = $('.newGroup').length;
		var id = count + 'GroupSelect';
		var append = '<div class="form-group subLevelGroup"><label class="col-md-2 control-label newGroup" data-id="' + count +'" data-group="' + groupname +'" data-mustatt="' + mustAttend + '" for="title">' + groupname +  ' (' + mustAttend + ')</label>';  
        append += '<div class="col-md-6">'
        append +='<select id="' + id + '" multiple="multiple"><option value="jack@gmail.com">Jack Wang</option> <option value="anna@gmail.com">Anna Tang</option><option value="jerry@gmail.com">Jerry Smith</option>';
        append += '<option value="leo@gmail.com">Leo White</option><option value="kevin@gmail.com">Kevin Brown</option><option value="amy@gmail.com">Amy Izzi</option></select>';
        append += '</div></div>';
        $("#customGroupDiv").append(append);
        $("#" + id).select2( {width: '98%'});

		$("#groupName").val('');
		$("#mustattendNum").val('');
     });

	$("#arrangeBtn").click(function(){
		var dates = $(".date").datepicker('getDates');
		var mustAttend = $("#mustAttSelect").val();
		var mayAttend = $("#mayAttSelect").val();
		emailList.push(mustAttend);
		emailList.push(mayAttend);
		var customGroup = [];
		var duration = $("#time").val();
		$( ".newGroup" ).each(function( i ) {
			var mustnumber = $(this).data("mustatt");
			var groupname = $(this).data("group");
			var id = $(this).data("id") + 'GroupSelect';
			var groupobj = {
				mustNumber: mustnumber,
				groupName : groupname,
				list : $("#" + id).val()
			}
			customGroup.push(groupobj);

		  });
		var obj = {
			dates : dates,
			mustAttend : mustAttend,
			mayAttend : mayAttend,
			customGroup: customGroup,
			duration: duration,
			when : $("#timeText").data("select")
		}

		$.ajax({
	        url: 'http://localhost:8080/postCal',
	        // dataType: "jsonp",
	        data: JSON.stringify(obj),
	        type: 'POST',
	        contentType:"application/json",
	       // jsonpCallback: 'callback', // this is not relevant to the POST anymore
	        success: function (data) {
	        	$("#scheduleForm").hide();
	        	$("#confirmDiv").show();
	        	window.scrollTo(0, 0);
	        	$("#startTime").html(data.optimalMeetingTimeSlot.startTime);
	        	$("#endTime").html(data.optimalMeetingTimeSlot.endTime);
	        	console.log(data);
	        },
	        error: function (xhr, status, error) {
	          	
	        },
    	});

		//alert(JSON.stringify(obj, null, 4));
	});

	$('#refreshButton').click(function(){
		location.reload();
	})

	$("#sendInviteBtn").click(function(){
		var emailArray = [];
		$.each( emailList, function(index, value) {
		   $.each(value, function(i, email){
		   		emailArray.push(email);
		   })
		});
		var obj = {
			startTime: $("#startinput").val(),
			endTime: $("#endinput").val(),
			message: $("#comment").val(),
			emailArray: emailArray,
			title: $("#title").val(),
			location: $("#location").val()
		};

		$.ajax({
	        url: 'http://localhost:8080/postSendMail',
	        // dataType: "jsonp",
	        data: JSON.stringify(obj),
	        type: 'POST',
	        contentType:"application/json",
	       // jsonpCallback: 'callback', // this is not relevant to the POST anymore
	        success: function (data) {
	        	if(data.success){
	    			$(':input').val("");
	    			$("#scheduleForm").show();
	        		$("#confirmDiv").hide();
	        		$("#successbox").show();
	        		window.scrollTo(0, 0);
	        	}
	        },
	        error: function (xhr, status, error) {
	          	
	        },
    	});
	});
});
