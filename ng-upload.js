// Version 0.2.1
// AngularJS simple file upload directive
// this directive uses an iframe as a target
// to enable the uploading of files without
// losing focus in the ng-app.
//
// <div ng-app="app">
//   <div ng-controller="mainCtrl">
//    <form action="/uploads" ng-upload="results()"> 
//      <input type="file" name="avatar"></input>
//      <input type="submit" value="Upload"></input>
//    </form>
//  </div>
// </div>
//
//  angular.module('app', ['ngUpload'])
//    .controller('mainCtrl', function($scope) {
//      $scope.results = function(content) {
//        console.log(content);
//      }  
//  });
//
angular.module('ngUpload', [])
  .directive('ngUpload', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        // Options (just 1 for now) 
        // Each option should be prefixed with 'upload-Options-' or 'uploadOptions'
        // {
        //    // specify whether to enable the submit button when uploading forms
        //    enableControls: bool 
        // }
        var options = {};
        options.enableControls = attrs.uploadOptionsEnableControls;
        
        // get scope function to execute on successful form upload
        if (attrs.ngUpload) {

          element.attr("target", "upload_iframe");
          element.attr("method", "post");

          // Append a timestamp field to the url to prevent browser caching results
          element.attr("action", element.attr("action") + "?_t=" + new Date().getTime());

          element.attr("enctype", "multipart/form-data");
          element.attr("encoding", "multipart/form-data");

          // Retrieve the callback function
          var fn = $parse(attrs.ngUpload);
          
          if (!angular.isFunction(fn)) {
              var message = "The expression on the ngUpload directive does not point to a valid function.";
              throw message + "\n";
          }                      

          // Helper function to create new iframe for each form submission
          var addNewDisposableIframe = function(submitControl) {
              // create a new iframe
              var iframe = angular.element("<iframe id='upload_iframe' name='upload_iframe' border='0' width='0' height='0' style='width: 0px; height: 0px; border: none; display: none' />");

              // attach function to load event of the iframe
              iframe.bind('load', function () {

                // get content - requires jQuery
                var content = iframe.contents().find('body').text();
                // execute the upload response function in the active scope
                scope.$apply(function () { 
                  fn(scope, { content: content, completed: content !== ""});
                });
                // remove iframe
                if (content !== "") // Fixes a bug in Google Chrome that dispose the iframe before content is ready.
                    setTimeout(function () { iframe.remove(); }, 250);

                //if (options.enableControls == null || !(options.enableControls.length >= 0))
                submitControl.attr('disabled', null);
                submitControl.attr('title', 'Click to start upload.');
              });

            // add the new iframe to application
            element.parent().append(iframe);
          };

          // 1) get the upload submit control(s) on the form (submitters must be decorated with the 'ng-upload-submit' class)
          // 2) attach a handler to the controls' click event
          var submitControl = element.find('.upload-submit');
          submitControl.bind('click', function () {

            addNewDisposableIframe(submitControl /* pass the submit control */);

            scope.$apply(function () { fn(scope, {content: "Please wait...", completed: false } /* upload not completed */); });

            var enabled = true;
            if (options.enableControls === null || options.enableControls === undefined || options.enableControls.length >= 0) {
                // disable the submit control on click
                submitControl.attr('disabled', 'disabled');
                enabled = false;
            }

            submitControl.attr('title', (enabled ? '[ENABLED]: ' : '[DISABLED]: ') + 'Uploading, please wait...');

            // submit the form
            element.submit();
          }).attr('title', 'Click to start upload.');
        }
        else
            console.log("No callback function found on the ngUpload directive.");
    }
};
}]);