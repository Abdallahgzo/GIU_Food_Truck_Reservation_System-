$(document).ready(function(){

    // Handle Registration Button Click
    $("#register").click(function() {
      const name = $('#name').val().trim();
      const email = $('#email').val().trim();
      const birthDate = $('#birthDate').val();
      const password = $('#password').val().trim();

      // Clear previous alerts
      $('#alertContainer').html('');

      // Validate required fields
      if(!name || !email || !birthDate || !password){
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            Please fill in all required fields.
          </div>
        `);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            Please enter a valid email address.
          </div>
        `);
        return;
      }

      // Validate password length
      if (password.length < 6) {
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            Password must be at least 6 characters long.
          </div>
        `);
        return;
      }

      const data = {
        name,
        email,
        birthDate,
        password
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user',
        data : data,
        success: function(serverResponse) {
          $('#alertContainer').html(`
            <div class="alert alert-success">
              Successfully registered! Redirecting to login...
            </div>
          `);
          setTimeout(function() {
            location.href = '/';
          }, 2000);
        },
        error: function(xhr) {
          const errorMsg = xhr.responseText || 'Registration failed. Please try again.';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
        }
      });
    });

    // Allow Enter key to submit
    $('#name, #email, #birthDate, #password').keypress(function(e) {
      if (e.which === 13) {
        $('#register').click();
      }
    });
});
