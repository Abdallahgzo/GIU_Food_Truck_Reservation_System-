$(document).ready(function() {
  loadTrucks();

  function loadTrucks() {
    $.ajax({
      type: "GET",
      url: '/api/v1/trucks/view',
      success: function(trucks) {
        $('#alertContainer').html('');
        $('#emptyState').hide();
        
        if (!trucks || trucks.length === 0) {
          $('#trucksContainer').hide();
          $('#emptyState').show();
          return;
        }

        $('#trucksContainer').show();
        $('#trucksContainer').html('');

        trucks.forEach(function(truck) {
          const truckCard = createTruckCard(truck);
          $('#trucksContainer').append(truckCard);
        });
      },
      error: function(xhr) {
        if (xhr.status === 403) {
          alert('Forbidden: You don\'t have access to this page');
          location.href = '/dashboard';
        } else {
          const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load trucks';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
          $('#trucksContainer').hide();
          $('#emptyState').show();
        }
      }
    });
  }

  function createTruckCard(truck) {
    const logoUrl = truck.truckLogo || '/images/404.jpg';
    const statusClass = truck.orderStatus === 'available' ? 'badge-available' : 'badge-unavailable';
    const statusText = truck.orderStatus === 'available' ? 'Available' : 'Unavailable';

    return `
      <div class="card">
        <div style="text-align: center; margin-bottom: 15px;">
          <img src="${logoUrl}" alt="${truck.truckName}" 
               style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 2px solid #000000;"
               onerror="this.src='/images/404.jpg'">
        </div>
        <div class="card-header" style="text-align: center;">
          ${truck.truckName}
        </div>
        <div class="card-body">
          <div style="text-align: center; margin-bottom: 15px;">
            <span class="badge ${statusClass}">${statusText}</span>
          </div>
          <div style="text-align: center;">
            <a href="/truckMenu/${truck.truckId}" class="btn-primary" style="text-decoration: none; display: inline-block;">
              View Menu
            </a>
          </div>
        </div>
      </div>
    `;
  }
});

