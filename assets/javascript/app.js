// inital topics array
var topics = ['the simpsons', 'homer simpson', 'bart simpson', 'lisa simpson', 'maggie simpson', 'marge simpson', 'grampa simpson', 'barney gumbel', 'sideshow bob', 'chief wiggum', 'ralph wiggum', 'milhouse', 'nelson muntz'];

var curTopic, lastInColHeight, lastInColTop, left, gifWidth, colWidth, numCols;
var containerWidth = $('.container').css('width').split('p')[0];
var endOfPage = 0;
var offset = 0;
var columnLefts = [];

// global constants
const asideWidth = $('.add-well').outerWidth();
const itemPadding = parseInt($('.result-list > li').css('padding-left'));
const itemBorderWidth = $('.result-list > li').css('border-left-width').split('p')[0];
const gutterWidth = 10;
const apiKey = '9D0xuOupi5AKDiYYkzFcM1gWkWMDLqCb';
const perCall = 50; //number of GIFs to pull per API call (for infinite scrolling)

// keep track of the total number of gifs for each topic for infinite scroll (initialize to value of perCall)
var totalGIFsForTopic = perCall;

function createButtons(topicArray) {
	for (var i = 0; i < topicArray.length; i++) {
		$('<button />').attr('id', 'button-' + i)
			.attr('data-value', topicArray[i])
			.addClass('btn btn-option topic')
			.prepend(topicArray[i])
			.appendTo($('#buttons'));
		if ($('#button-' + i).text() == curTopic) {
			$('#button-' + i).addClass('btn-selected');
		}
	}
}

function addSelectedButtonStyle() {
	for (var i = 0; i < topics.length; i++) {
		if ($('#button-' + i).text() == curTopic) {
			$('#button-' + i).removeClass('pulsate')
				.addClass('btn-selected');
			break;
		}
	}
}

function setColumns() {	
	containerWidth = $('.container').width();

	if (containerWidth >= 1100)
		numCols = 4;
	else if (containerWidth < 1100 && containerWidth >= 832.5)
		numCols = 3;
	else if (containerWidth < 832.5 && containerWidth >= 555)
		numCols = 2;
	else
		numCols = 1;

	colWidth = (containerWidth - (gutterWidth * (numCols - 1))) / numCols;
	gifWidth = colWidth - (itemPadding * 2) - (itemBorderWidth * 2);
	
	columnLefts = [];
	for(var i = 0; i < numCols; i++) {
		columnLefts.push((colWidth + gutterWidth) * i);
	}
}

//handles creation and lazy-loading of GIFs and their containers
function buildItems(response, offset = 0) {
	var results = response.data;

	if (offset === 0 && results.length === 0) {
		$('<h2>').text('There are no GIFs for this topic. Sorry!').attr('style', 'position: absolute; top: 50px').appendTo($('#results'));
		return;
	} else {
		$('#results h2').remove();
	}

	if(offset === 0) {
		$('.result-list').empty();
	} 

	for (var i = offset; i < results.length + offset; i++) {
		var result = results[i - offset];
		var adjustedHeight = result.images.fixed_width.height * (gifWidth / result.images.fixed_width.width);
		var imgItem = $('<li>').attr('id', 'item-' + i)
			.attr('style', 'top: 0')
			.addClass('list-item');
		var imgDiv = $('<div class="img-div">').attr('id', 'imgDiv-' + i)
			.attr('style', 'background-color: ' + randomColor() + '; width: 100%; height: ' +  adjustedHeight + 'px;');
		var img = $('<img />').attr('id', 'img-' + i)
			.attr('src', 'assets/images/blank.gif')
			.attr('data-src', result.images.fixed_width_still.url)
			.attr('data-width', result.images.fixed_width.width)
			.attr('data-height', result.images.fixed_width.height)
			.attr('data-still', result.images.fixed_width_still.url)
			.attr('data-animated', result.images.fixed_width.url)
			.attr('data-state', 'still')
			.attr('data-appear-vertical-offset', '500')
			.attr('alt', result.title)
			.addClass('result-image');
		var rating = $('<span>').attr('id', 'rating-' + result.id)
			.addClass('rating-span')
			.text('Rating: ' + result.rating.toUpperCase());
		$('.result-list').append(imgItem.append(imgDiv.append(img)).append(rating));				

		// this determines the value of the "left" css property to be used (see global "columnLefts" array)
		left = columnLefts[i % numCols];

		if(i > numCols - 1) {
			// find height of last item in same column as item to be updated
			lastInColHeight = $('#item-' + (i - numCols)).outerHeight(true);
			// find "top" css value of last item in same column as item to be updated
			lastInColTop = $('#item-' + (i - numCols)).css('top').split('p')[0];
			// append "style" HTML attribute to item to position it properly
			$('#item-' + i).attr('style', 'width: ' + colWidth + 'px; position: absolute; left: ' + left + 'px; top: ' + (parseInt(lastInColHeight) + parseInt(lastInColTop) + gutterWidth + 'px'));
		} else {
			lastInColHeight = $('#item-' + i).outerHeight(true);
			lastInColTop = $('.options-div').outerHeight();
			$('#item-' + i).attr('style', 'width: ' + colWidth + 'px; position: absolute; left: ' + left + 'px; top: ' + parseInt(lastInColTop) + 'px');
		}

		if (i === results.length + offset - 1) {
			endOfPage = parseFloat($('#item-' + i).outerHeight(true)) + parseFloat($('#item-' + i).css('top').split('p')[0]);
		}
	}

	$('.result-image').Lazy({
		scrollDirection: 'vertical',
		effect: 'fadeIn',
		effectTime: 400,
		visibleOnly: true,
		defaultImage: 'assets/images/blank.gif',
		afterLoad: function(element) {
			$(element).appear();
		}
	});
}

function error() {
	$('#results').empty();
	$('<h2 class="red">').text('ERROR: Unable to retrieve GIFs!').attr('style', 'position: absolute; top: 50px').appendTo($('#results'));
	doh();
}

function getInfiniteGIFs(topic, force = false) {
	if (curTopic != topic || force) {
		if (topic != curTopic) {
			offset = 0;
			//in case last topic returned zero GIFs, we must reset totalGIFsForTopic
			totalGIFsForTopic = perCall;
		}
		if (offset < totalGIFsForTopic) {
			$.ajax('https://api.giphy.com/v1/gifs/search?q=' + encodeURIComponent(topic) + '&api_key=' + apiKey + '&offset=' + offset + '&limit=' + perCall)
				.done(function (response) {
					totalGIFsForTopic = response.pagination.total_count;
					if(topic != curTopic) {
						$('.result-list').empty();
					}
					$('.topic').removeClass('btn-selected');
					curTopic = topic;
					addSelectedButtonStyle();
					populateDropdown(topics);
					buildItems(response, offset);
					
					window.onscroll = function() {
						if ((window.innerHeight + Math.ceil(window.pageYOffset + 1)) >= endOfPage - 100) {
							window.onscroll = null;
							getInfiniteGIFs(curTopic, true);
						}
					};

					offset += perCall;
				})
				.fail(function () {
					error();
				});
		}
	}
}

function getGIFs(topic, limit, force = false) {
	if (curTopic != topic || force) {
		// we have to reset the offset for infinite scrolling AND nullify the onscroll event every time the user chooses to go from infinite GIFs back to finite GIFs
		offset = 0;
		window.onscroll = null;

		$.ajax('https://api.giphy.com/v1/gifs/search?q=' + encodeURIComponent(topic) + '&api_key=' + apiKey + '&limit=' + limit)
			.done(function (response) {
				if(topic != curTopic) {
					$('.result-list').empty();
				}
				$('.topic').removeClass('btn-selected');
				curTopic = topic;
				addSelectedButtonStyle();
				populateDropdown(topics);
				buildItems(response);
			})
			.fail(function () {
				error();
			});
	}
}

function randomColor() {
	var colors = ['#f9db45', '#98d9f9', '#999999', '#d5effc', '#000000', '#ff0000', '#00ff00', '#0000ff', '#00ffff', '#ff00ff'];
	return colors[Math.floor(Math.random() * colors.length)];
}

function toggleAnimation(imgId) {
	var img = $('#' + imgId);
	if (img.attr('data-state') === 'animated') {
		img.attr('src', img.attr('data-still'))
			.attr('data-state', 'still');
	} else {
		img.attr('src', img.attr('data-animated'))
			.attr('data-state', 'animated');
	}
}

function addTopic(value) {
	var alreadyAdded = false;
	var topicIndex = 0;
	var formattedValue = value.trim().toLowerCase();
	$('#formMessage').addClass('hidden').text('');
	for (var i = 0; i < topics.length; i++) {
		if (topics[i].toLowerCase() === formattedValue) {
			$('#button-' + i).addClass('pulsate');
			topicIndex = i;
			$('#formMessage').removeClass('hidden green')
				.text('That topic already exists.')
				.addClass('red');
			alreadyAdded = true;
			break;
		}
	}

	if (!alreadyAdded && formattedValue.length > 0) {
		topics.push(formattedValue);
		$('#buttons').empty();
		$('#formMessage').removeClass('hidden')
			.addClass('green')
			.text('Topic added successfully!');
		createButtons(topics);
		populateDropdown(topics);
		$('#button-' + (topics.length - 1)).addClass('pulsate');
	} else if (formattedValue.length === 0) {
		$('#formMessage').removeClass('hidden green')
			.text('Please enter a topic.')
			.addClass('red');
	}

	$('#input').val('');
	setTimeout(function () {
		$('#button-' + topicIndex + ', #button-' + (topics.length - 1)).removeClass('pulsate');
		$('#formMessage').addClass('hidden');
	}, 6000);
}

function doh() {
	var audio = document.getElementById('audio');
	audio.play();
}

function populateDropdown(array) {
	$('#ddlSticky').empty();
	for (var i = 0; i < array.length; i++) {
		var option = $('<option>').text(array[i]);
		if (curTopic == array[i]) {
			option.attr('selected', 'selected');
		}
		$('#ddlSticky').append(option);
	}
}

function repositionItem(index) {
	left = columnLefts[index % numCols];
	var adjustedHeight = $('#img-' + index).data('height') * (gifWidth / $('#img-' + index).data('width'));
	if(index > numCols - 1) {
		// find height of last item in same column as item to be updated
		lastInColHeight = $('#item-' + (index - numCols)).outerHeight(true);
		// find "top" css value of last item in same column as item to be updated
		lastInColTop = $('#item-' + (index - numCols)).css('top').split('p')[0];
		// append "style" HTML attribute to item to position it properly
		$('#item-' + index).attr('style', 'width: ' + colWidth + 'px; position: absolute; left: ' + left + 'px; top: ' + (parseInt(lastInColHeight) + parseInt(lastInColTop) + gutterWidth + 'px'));
	} else {
		lastInColHeight = $('#item-' + index).outerHeight(true);
		lastInColTop = $('.options-div').outerHeight();
		$('#item-' + index).attr('style', 'width: ' + colWidth + 'px; position: absolute; left: ' + left + 'px; top: ' + parseInt(lastInColTop) + 'px');
	}
	$('#imgDiv-' + index).attr('style', 'background-color: ' + randomColor() + '; width: 100%; height: ' +  adjustedHeight + 'px;');
}

function sizeButtonDiv() {
	if (containerWidth > 555)
		$('.button-div').css('width', parseInt(containerWidth - asideWidth - gutterWidth) + 'px');
	else
		$('.button-div').css('width', '100%');
}

function init() {
	setColumns();
	sizeButtonDiv();
	getGIFs(topics[0], 10);
	createButtons(topics);
	populateDropdown(topics);
}

$(document).ready(function () {
	init();	

	$(window).on('resize', function() {	
		setColumns();
		sizeButtonDiv();
		for (var i = 0; i < $('.result-image').length; i++) {
			repositionItem(i);

			//reset endOfPage so api gets called at the right time
			if (i === $('.result-image').length - 1)
				endOfPage = parseFloat($('#item-' + i).outerHeight(true)) + parseFloat($('#item-' + i).css('top').split('p')[0]);
		}
	});
	
	$(window).on('scroll', function() {
		var pos = $('#results').offset();
		if ($('#numGifs').val() == 'infinite' && $(this).scrollTop() > pos.top) {
			$('#stickyNav').removeClass('hidden').addClass('fixed');
		} else {
			$('#stickyNav').addClass('hidden').removeClass('fixed');
		}
	});

	$('body').on('appear', '.result-image', function(event, $affected) {
		$affected.each(function() {
			$(this).animate({ opacity: 1 }, 400);
		});
	});

	$('body').on('disappear', '.result-image', function(event, $affected) {
		$affected.each(function() {
			$(this).animate({ opacity: 0 }, 0);
		});
	});

	$('body').on('click', '.topic', function () {
		if($('#numGifs').val() == 'infinite') {
			getInfiniteGIFs($(this).attr('data-value'), true);
		} else {
			getGIFs($(this).attr('data-value'), $('#numGifs').val());
		}
	});

	$('body').on('change', '#ddlSticky', function () {
		getInfiniteGIFs($(this).val(), true);
	});

	$('body').on('click', '.result-image', function () {
		toggleAnimation($(this).attr('id'));
	});

	$('body').on('change', '#numGifs', function() {
		if($(this).val() == 'infinite') {
			getInfiniteGIFs(curTopic, true);
		} else {
			getGIFs(curTopic, $(this).val(), true);
		}
	});

	$('#form').on('submit', function (event) {
		event.preventDefault();
		addTopic($('#input').val());
	});
});