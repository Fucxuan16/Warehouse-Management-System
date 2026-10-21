(function () {
  "use strict";

  const LOW_STOCK_LIMIT = 5;
  const numberFormat = new Intl.NumberFormat("vi-VN");
  const currencyFormat = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  });
  const elements = {
    loginScreen: document.querySelector("#login-screen"),
    loginForm: document.querySelector("#login-form"),
    loginError: document.querySelector("#login-error"),
    appShell: document.querySelector("#app-shell"),
    userName: document.querySelector("#user-name"),
    userAvatar: document.querySelector("#user-avatar"),
    notice: document.querySelector("#notice"),
    importDialog: document.querySelector("#import-dialog"),
    exportDialog: document.querySelector("#export-dialog"),
    importForm: document.querySelector("#import-form"),
    exportForm: document.querySelector("#export-form"),
    importError: document.querySelector("#import-error"),
    exportError: document.querySelector("#export-error"),
    exportProduct: document.querySelector("#export-product"),
    exportStockHint: document.querySelector("#export-stock-hint"),
    searchInput: document.querySelector("#search-input"),
    stockFilter: document.querySelector("#stock-filter"),
    inventoryBody: document.querySelector("#inventory-body"),
    activityBody: document.querySelector("#activity-body"),
    emptyState: document.querySelector("#empty-state"),
    emptyTitle: document.querySelector("#empty-title"),
    emptyDescription: document.querySelector("#empty-description"),
    activityEmpty: document.querySelector("#activity-empty")
  };
  let inventory = [];
  let activity = [];
  let currentUser = null;
  let isRefreshing = false;
  let noticeTimer;

  function showNotice(message, isError) {
    window.clearTimeout(noticeTimer);
    elements.notice.textContent = message;
    elements.notice.classList.toggle("error", Boolean(isError));
    elements.notice.hidden = false;
    noticeTimer = window.setTimeout(function () {
      elements.notice.hidden = true;
    }, 4200);
  }

  async function apiRequest(url, options) {
    const response = await fetch(url, Object.assign({
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin"
    }, options || {}));
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      if (response.status === 401 && currentUser) showLoginScreen();
      throw new Error(result && result.error ? result.error : "Yêu cầu không thành công.");
    }
    return result;
  }

  async function loadData() {
    if (isRefreshing || !currentUser) return false;
    isRefreshing = true;
    try {
      const result = await apiRequest("/api/data");
      inventory = result.inventory;
      activity = result.activity;
      render();
      return true;
    } finally {
      isRefreshing = false;
    }
  }

  function showLoginScreen(message) {
    currentUser = null;
    elements.appShell.hidden = true;
    elements.loginScreen.hidden = false;
    clearFormError(elements.loginError);
    if (message) showFormError(elements.loginError, message);
  }

  function showApplication(user) {
    currentUser = user;
    elements.userName.textContent = user.username;
    elements.userAvatar.textContent = user.username.charAt(0).toLocaleUpperCase("vi");
    elements.loginScreen.hidden = true;
    elements.appShell.hidden = false;
  }

  async function checkSession() {
    try {
      const result = await apiRequest("/api/session");
      if (!result.user) {
        showLoginScreen();
        return;
      }
      showApplication(result.user);
      await loadData();
    } catch (error) {
      showLoginScreen("Không thể kết nối máy chủ: " + error.message);
    }
  }

  async function refreshData() {
    try {
      await loadData();
    } catch (error) {
      showNotice("Không thể tải dữ liệu kho: " + error.message, true);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearFormError(elements.loginError);
    const submitButton = elements.loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const form = new FormData(elements.loginForm);
      const result = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username")),
          password: String(form.get("password"))
        })
      });
      elements.loginForm.reset();
      showApplication(result.user);
      try {
        await loadData();
      } catch (refreshError) {
        showNotice("Đăng nhập thành công nhưng chưa tải được dữ liệu kho: " + refreshError.message, true);
      }
    } catch (error) {
      showFormError(elements.loginError, error.message);
    } finally {
      submitButton.disabled = false;
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/api/logout", { method: "POST" });
      showLoginScreen();
    } catch (error) {
      showNotice("Không thể đăng xuất: " + error.message, true);
    }
  }

  function getStockStatus(quantity) {
    if (quantity === 0) return { label: "Hết hàng", className: "badge-out" };
    if (quantity <= LOW_STOCK_LIMIT) return { label: "Sắp hết", className: "badge-low" };
    return { label: "Còn hàng", className: "badge-available" };
  }

  function makeCell(text, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = text;
    return cell;
  }

  function renderInventory() {
    const query = elements.searchInput.value.trim().toLocaleLowerCase("vi");
    const filter = elements.stockFilter.value;
    const filtered = inventory
      .filter(function (product) {
        const matchesSearch = product.id.includes(elements.searchInput.value.trim());
        const matchesFilter = filter === "all" ||
          (filter === "available" && product.quantity >= LOW_STOCK_LIMIT) ||
          (filter === "low" && product.quantity <= LOW_STOCK_LIMIT) ||
          (filter === "out" && product.quantity === 0);
        return matchesSearch && matchesFilter;
      })
      .sort(function (a, b) { return a.name.localeCompare(b.name, "vi"); });

    elements.inventoryBody.replaceChildren();
    filtered.forEach(function (product) {
      const row = document.createElement("tr");
      const status = getStockStatus(product.quantity);
      row.appendChild(makeCell(product.id, "product-id"));
      row.appendChild(makeCell(product.name, "product-name"));
      row.appendChild(makeCell(formatDate(product.importDate)));
      row.appendChild(makeCell(currencyFormat.format(product.purchasePrice), "price"));
      row.appendChild(makeCell(currencyFormat.format(product.salePrice), "price"));
      row.appendChild(makeCell(numberFormat.format(product.quantity), "quantity"));

      const statusCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "stock-badge " + status.className;
      badge.textContent = status.label;
      statusCell.appendChild(badge);
      row.appendChild(statusCell);

      const actionCell = document.createElement("td");
      const exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.className = "row-action";
      exportButton.textContent = "Xuất hàng";
      exportButton.disabled = product.quantity === 0;
      exportButton.addEventListener("click", function () {
        openExportDialog(product.id);
      });
      actionCell.appendChild(exportButton);
      row.appendChild(actionCell);
      elements.inventoryBody.appendChild(row);
    });

    document.querySelector("#total-products").textContent = numberFormat.format(filtered.length);
    document.querySelector("#total-quantity").textContent = numberFormat.format(
      inventory.filter(function (product) { return product.quantity > LOW_STOCK_LIMIT; })
        .reduce(function (sum, product) { return sum + product.quantity; }, 0)
    );
    document.querySelector("#low-stock").textContent = numberFormat.format(
      inventory.filter(function (product) {
        return product.quantity > 0 && product.quantity < LOW_STOCK_LIMIT;
      }).length
    );
    document.querySelector("#out-of-stock").textContent = numberFormat.format(
      inventory.filter(function (product) { return product.quantity === 0; }).length
    );
    document.querySelector("#item-count").textContent = numberFormat.format(inventory.length) + " mặt hàng";
    document.querySelector("#table-summary").textContent =
      "Hiển thị " + numberFormat.format(filtered.length) + " / " + numberFormat.format(inventory.length) + " mặt hàng";

    const noProducts = inventory.length === 0;
    const noResults = !noProducts && filtered.length === 0;
    elements.emptyState.classList.toggle("visible", noProducts || noResults);
    elements.emptyTitle.textContent = noResults ? "Không tìm thấy mặt hàng" : "Chưa có hàng hóa";
    elements.emptyDescription.textContent = noResults
      ? "Thử tìm bằng mã hàng hoặc tên hàng khác."
      : "Thêm mặt hàng đầu tiên để bắt đầu quản lý kho.";
    document.querySelector("#empty-import-button").hidden = noResults;
    document.querySelector(".table-footer").hidden = noProducts || noResults;
    renderExportOptions();
  }

  function renderExportOptions(selectedId) {
    const previousSelection = selectedId || elements.exportProduct.value;
    elements.exportProduct.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = inventory.length ? "Chọn mặt hàng cần xuất" : "Chưa có mặt hàng trong kho";
    placeholder.disabled = true;
    placeholder.selected = true;
    elements.exportProduct.appendChild(placeholder);

    inventory.filter(function (product) { return product.quantity > 0; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, "vi"); })
      .forEach(function (product) {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.id + " - " + product.name + " (tồn: " + numberFormat.format(product.quantity) + ")";
        elements.exportProduct.appendChild(option);
      });

    if (previousSelection && inventory.some(function (product) {
      return product.id === previousSelection && product.quantity > 0;
    })) {
      elements.exportProduct.value = previousSelection;
    }
    updateExportStockHint();
  }

  function renderActivity() {
    const recent = activity.slice(-8).reverse();
    elements.activityBody.replaceChildren();
    recent.forEach(function (entry) {
      const row = document.createElement("tr");
      const typeCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "movement-badge " + (entry.type === "in" ? "movement-in" : "movement-out");
      badge.textContent = entry.type === "in" ? "Nhập hàng" : "Xuất hàng";
      typeCell.appendChild(badge);
      row.appendChild(typeCell);
      row.appendChild(makeCell(entry.id, "product-id"));
      row.appendChild(makeCell(entry.name, "product-name"));
      row.appendChild(makeCell((entry.type === "in" ? "+" : "−") + numberFormat.format(entry.quantity), "quantity"));
      row.appendChild(makeCell(formatTimestamp(entry.timestamp)));
      elements.activityBody.appendChild(row);
    });
    elements.activityEmpty.hidden = recent.length > 0;
  }

  function formatDate(value) {
    const parts = value.split("-");
    return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : value;
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function showFormError(element, message) {
    element.textContent = message;
    element.hidden = false;
  }

  function clearFormError(element) {
    element.textContent = "";
    element.hidden = true;
  }

  function openImportDialog() {
    elements.importForm.reset();
    elements.importForm.elements.date.value = getLocalDate();
    clearFormError(elements.importError);
    elements.importDialog.showModal();
    elements.importForm.elements.id.focus();
  }

  function openExportDialog(selectedId) {
    elements.exportForm.reset();
    clearFormError(elements.exportError);
    renderExportOptions(selectedId);
    elements.exportDialog.showModal();
    if (selectedId) elements.exportForm.elements.quantity.focus();
    else elements.exportProduct.focus();
  }

  function updateExportStockHint() {
    const product = inventory.find(function (item) { return item.id === elements.exportProduct.value; });
    elements.exportStockHint.textContent = product
      ? "Số lượng hiện có: " + numberFormat.format(product.quantity) + " sản phẩm."
      : "Chọn một mặt hàng để xem số lượng tồn.";
    const extraAllowed = product
      ? (product.quantity >= 8 ? 2 : product.quantity >= 5 ? 1 : 0)
      : 0;
    elements.exportForm.elements.quantity.max = product
      ? String(product.quantity + extraAllowed)
      : "";
  }

  function getLocalDate() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  async function handleImport(event) {
    event.preventDefault();
    clearFormError(elements.importError);
    const form = new FormData(elements.importForm);
    const id = String(form.get("id")).trim();
    const name = String(form.get("name")).trim();
    const importDate = String(form.get("date"));
    const quantity = Number(form.get("quantity"));
    const purchasePrice = Number(form.get("purchasePrice"));
    const salePrice = Number(form.get("salePrice"));

    if (!id || !name || !importDate || !Number.isSafeInteger(quantity) || quantity < 1 ||
        !Number.isSafeInteger(purchasePrice) || purchasePrice < 0 ||
        !Number.isSafeInteger(salePrice) || salePrice < 0) {
      showFormError(elements.importError, "Vui lòng kiểm tra lại thông tin và nhập số lượng là số nguyên lớn hơn 0.");
      return;
    }

    const submitButton = elements.importForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      await apiRequest("/api/inventory/import", {
        method: "POST",
        body: JSON.stringify({ id: id, name: name, importDate: importDate,
          quantity: quantity, purchasePrice: purchasePrice, salePrice: salePrice })
      });
      elements.importDialog.close();
      showNotice("Đã nhập " + numberFormat.format(quantity + 1) + " sản phẩm " + name + ".");
      try {
        await loadData();
      } catch (refreshError) {
        showNotice("Đã ghi nhận phiếu nhập, nhưng chưa thể làm mới dữ liệu: " + refreshError.message, true);
      }
    } catch (error) {
      showFormError(elements.importError, error.message);
    } finally {
      submitButton.disabled = false;
    }
  }

  async function handleExport(event) {
    event.preventDefault();
    clearFormError(elements.exportError);
    const id = elements.exportProduct.value;
    const quantity = Number(elements.exportForm.elements.quantity.value);
    const product = inventory.find(function (item) { return item.id === id; });

    if (!product || !Number.isSafeInteger(quantity) || quantity < 1) {
      showFormError(elements.exportError, "Vui lòng chọn mặt hàng và nhập số lượng xuất là số nguyên lớn hơn 0.");
      return;
    }
    const extraAllowed = product.quantity >= 8 ? 2 : product.quantity >= 5 ? 1 : 0;
    if ((product.quantity === 4 && quantity === 3) ||
        (product.quantity <= 5 && quantity === product.quantity) ||
        quantity > product.quantity + extraAllowed) {
      showFormError(elements.exportError,
        quantity > product.quantity + extraAllowed
          ? "Số lượng xuất vượt tồn kho. Hiện chỉ còn " + numberFormat.format(product.quantity) + " sản phẩm."
          : "Không thể xuất số lượng này. Vui lòng kiểm tra lại tồn kho.");
      return;
    }

    const submitButton = elements.exportForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      await apiRequest("/api/inventory/export", {
        method: "POST",
        body: JSON.stringify({ id: id, quantity: quantity })
      });
      elements.exportDialog.close();
      showNotice("Đã xuất " + numberFormat.format(quantity) + " sản phẩm " + product.name + ".");
      try {
        await loadData();
      } catch (refreshError) {
        showNotice("Đã ghi nhận phiếu xuất, nhưng chưa thể làm mới dữ liệu: " + refreshError.message, true);
      }
    } catch (error) {
      showFormError(elements.exportError, error.message);
    } finally {
      submitButton.disabled = false;
    }
  }

  function render() {
    renderInventory();
    renderActivity();
  }

  document.querySelector("#import-button").addEventListener("click", openImportDialog);
  document.querySelector("#empty-import-button").addEventListener("click", openImportDialog);
  document.querySelector("#export-button").addEventListener("click", function () { openExportDialog(); });
  document.querySelector("#logout-button").addEventListener("click", handleLogout);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.importForm.addEventListener("submit", handleImport);
  elements.exportForm.addEventListener("submit", handleExport);
  elements.searchInput.addEventListener("input", renderInventory);
  elements.stockFilter.addEventListener("change", renderInventory);
  elements.exportProduct.addEventListener("change", updateExportStockHint);
  document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelector("#" + button.dataset.close).close();
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !elements.importDialog.open && !elements.exportDialog.open &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });

  window.addEventListener("focus", refreshData);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") refreshData();
  });
  window.setInterval(function () {
    if (currentUser) refreshData();
  }, 15000);
  checkSession();
}());
