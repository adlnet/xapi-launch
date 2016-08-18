(function () {
  var VISIBLE_CLASS = 'is-showing-options',
  fab_btn = document.getElementById('fab_btn'),
  fab_ctn = document.getElementById('fab_ctn'),
  showOpts = function(e) {
    var processclick = function (evt) {
      if (e !== evt) {
        fab_ctn.classList.remove(VISIBLE_CLASS);
        fab_ctn.IS_SHOWING = false;
        document.removeEventListener('click', processclick);
      }
    };
    if (!fab_ctn.IS_SHOWING) {
      fab_ctn.IS_SHOWING = true;
      fab_ctn.classList.add(VISIBLE_CLASS);
      document.addEventListener('click', processclick);
    }
  };
  fab_ctn.addEventListener('click', showOpts);
}.call(this));

$('.floatingContainer').hover(function(){
  //$('.subActionButton').addClass('display');
}, function(){
  $('.subActionButton').removeClass('display');
  $('.actionButton').removeClass('open');
});
$('.subActionButton').hover(function(){
  $(this).find('.floatingText').addClass('show');
}, function(){
  $(this).find('.floatingText').removeClass('show');
});

$('.actionButton').hover(function(){
  $(this).addClass('open');
  $(this).find('.floatingText').addClass('show');
  $('.subActionButton').addClass('display');
}, function(){
  $(this).find('.floatingText').removeClass('show');
});
