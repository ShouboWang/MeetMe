$( document ).ready(function() {
	$('.date').datepicker({
		multidate: true,
		startDate: '+0d'
	});
	$("#mustAttSelect").select2({ width: '98%' });  
	$("#mayAttSelect").select2({ width: '98%' });      
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


		alert(JSON.stringify(obj, null, 4));
	})
});
