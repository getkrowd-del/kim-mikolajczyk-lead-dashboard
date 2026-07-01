(function() {
      var endpoint = document.querySelector('meta[name="sheet-data-url"]')?.content;
      if (!endpoint) return;
      var container = document.getElementById('sheet-data');
      var errorDiv = document.getElementById('menu-error');
      var countEl = document.getElementById('lead-count');
      var emptyState = document.getElementById('empty-state');
      var sortBtn = document.getElementById('sort-date');
      var activeStatus = 'All';
      var newestFirst = true;
      var cachedRows = [];

      function normalizeDate(val) {
        var d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      }

      function renderRows(rows) {
        if (!container) return;
        var filtered = rows.filter(function(row) {
          var status = (row.Status || row.status || '').trim();
          return activeStatus === 'All' ? true : status.toLowerCase() === activeStatus.toLowerCase();
        });

        filtered.sort(function(a, b) {
          var da = normalizeDate(a['Submitted At'] || a.submitted_at || a.submittedAt);
          var db = normalizeDate(b['Submitted At'] || b.submitted_at || b.submittedAt);
          return newestFirst ? (db - da) : (da - db);
        });

        if (countEl) countEl.textContent = String(rows.length);

        if (!filtered.length) {
          container.innerHTML = '';
          if (emptyState) emptyState.classList.remove('hidden');
          return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        container.innerHTML = filtered.map(function(row) {
          var fullName = row['Full Name'] || row.full_name || row.Name || row.name || '';
          var email = row.Email || row.email || '';
          var phone = row.Phone || row.phone || '';
          var address = row.Address || row.address || '';
          var timeframe = row.Timeframe || row.timeframe || '';
          var message = row.Message || row.message || '';
          var submittedAt = row['Submitted At'] || row.submitted_at || row.submittedAt || '';
          var status = row.Status || row.status || 'New';
          var statusClass = 'bg-slate-100 text-slate-700';
          if (String(status).toLowerCase() === 'new') statusClass = 'bg-blue-50 text-blue-700';
          if (String(status).toLowerCase() === 'contacted') statusClass = 'bg-amber-50 text-amber-700';
          if (String(status).toLowerCase() === 'converted') statusClass = 'bg-emerald-50 text-emerald-700';

          function cell(value) {
            return '<td class="px-4 py-4 align-top text-sm text-slate-700">' + (value ? value : '<span class="text-slate-300">—</span>') + '</td>';
          }

          return '<tr>' +
            cell('<div class="font-semibold text-slate-900">' + fullName + '</div>') +
            cell(email ? '<a class="hover:text-[#1B2A4A] hover:underline" href="mailto:' + email + '">' + email + '</a>' : '') +
            cell(phone ? '<a class="hover:text-[#1B2A4A] hover:underline" href="tel:' + phone.replace(/[^+\d]/g, '') + '">' + phone + '</a>' : '') +
            cell(address) +
            cell(timeframe) +
            cell('<span class="block max-w-[320px] whitespace-normal break-words">' + message + '</span>') +
            cell(submittedAt) +
            cell('<span class="status-pill inline-flex rounded-full px-3 py-1 text-xs font-semibold ' + statusClass + '">' + status + '</span>') +
          '</tr>';
        }).join('');
      }

      function updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(function(btn) {
          var isActive = btn.dataset.status === activeStatus;
          btn.classList.toggle('bg-white', isActive);
          btn.classList.toggle('shadow-sm', isActive);
          btn.classList.toggle('text-[#1B2A4A]', isActive);
          btn.classList.toggle('text-slate-700', !isActive);
        });
      }

      function fetchSheet() {
        fetch(endpoint)
          .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .then(function(result) {
            if (!container || !result.data || result.data.length === 0) {
              if (errorDiv) errorDiv.classList.remove('hidden');
              return;
            }
            if (errorDiv) errorDiv.classList.add('hidden');
            cachedRows = result.data;
            renderRows(cachedRows);
            updateFilterButtons();
          })
          .catch(function(err) {
            console.error('Sheet data error:', err);
            if (errorDiv) errorDiv.classList.remove('hidden');
          });
      }

      document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          activeStatus = btn.dataset.status || 'All';
          renderRows(cachedRows);
          updateFilterButtons();
        });
      });

      if (sortBtn) {
        sortBtn.addEventListener('click', function() {
          newestFirst = !newestFirst;
          sortBtn.textContent = 'Sort by Date: ' + (newestFirst ? 'Newest' : 'Oldest');
          renderRows(cachedRows);
        });
      }

      fetchSheet();
      setInterval(fetchSheet, 60000);
    })();