$(document).ready(function(){
    $("#submit").click(function() {
      const email = $('#email').val().trim();
      const password = $('#password').val().trim();

      // Clear previous alerts
      $('#alertContainer').html('');

      // Validate empty fields
      if (!email || !password) {
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            Please enter both email and password.
          </div>
        `);
        return;
      }

      const data = {
        email,
        password,
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user/login',
        data,
        success: function(serverResponse) {
          if(serverResponse) {
            $('#alertContainer').html(`
              <div class="alert alert-success">
                Login successful! Redirecting...
              </div>
            `);
            setTimeout(function() {
              location.href = '/dashboard';
            }, 1000);
          }
        },
        error: function(xhr) {
          const errorMsg = xhr.responseText || 'Invalid credentials. Please try again.';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
        }
      });
    });

    // Allow Enter key to submit
    $('#email, #password').keypress(function(e) {
      if (e.which === 13) {
        $('#submit').click();
      }
    });
});
