(function () {
  "use strict";

  const STORAGE_KEY = "khohang.data.v1";
  const LOW_STOCK_LIMIT = 5;
  const numberFormat = new Intl.NumberFormat("vi-VN");
  const currencyFormat = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  });
  const elements = {
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

  function isValidProduct(product) {
    return product &&
      typeof product.id === "string" &&
      typeof product.name === "string" &&
      typeof product.importDate === "string" &&
      Number.isFinite(product.purchasePrice) &&
      product.purchasePrice >= 0 &&
      Number.isFinite(product.salePrice) &&
      product.salePrice >= 0 &&
      Number.isSafeInteger(product.quantity) &&
      product.quantity >= 0;
  }

  function loadData() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) return;
      const parsed = JSON.parse(stored);
      if (!parsed || !Array.isArray(parsed.inventory) || !Array.isArray(parsed.activity) ||
          !parsed.inventory.every(isValidProduct)) {
        throw new Error("Dữ liệu lưu trong trình duyệt không đúng định dạng.");
      }
      inventory = parsed.inventory;
      activity = parsed.activity.filter(function (entry) {
        return entry &&
          (entry.type === "in" || entry.type === "out") &&
          typeof entry.id === "string" &&
          typeof entry.name === "string" &&
          Number.isSafeInteger(entry.quantity) &&
          entry.quantity > 0 &&
          typeof entry.timestamp === "string";
      });
    } catch (error) {
      showNotice("Không thể đọc dữ liệu đã lưu: " + error.message, true);
    }
  }

  function saveData(nextInventory, nextActivity) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        inventory: nextInventory,
        activity: nextActivity
      }));
      return true;
    } catch (error) {
      showNotice("Không thể lưu dữ liệu trên trình duyệt: " + error.message, true);
      return false;
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
        const matchesSearch = product.id.toLocaleLowerCase("vi").includes(query) ||
          product.name.toLocaleLowerCase("vi").includes(query);
        const matchesFilter = filter === "all" ||
          (filter === "available" && product.quantity > LOW_STOCK_LIMIT) ||
          (filter === "low" && product.quantity > 0 && product.quantity <= LOW_STOCK_LIMIT) ||
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

    document.querySelector("#total-products").textContent = numberFormat.format(inventory.length);
    document.querySelector("#total-quantity").textContent = numberFormat.format(
      inventory.reduce(function (sum, product) { return sum + product.quantity; }, 0)
    );
    document.querySelector("#low-stock").textContent = numberFormat.format(
      inventory.filter(function (product) {
        return product.quantity > 0 && product.quantity <= LOW_STOCK_LIMIT;
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
    elements.exportForm.elements.quantity.max = product ? String(product.quantity) : "";
  }

  function getLocalDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function handleImport(event) {
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
        !Number.isFinite(purchasePrice) || purchasePrice < 0 ||
        !Number.isFinite(salePrice) || salePrice < 0) {
      showFormError(elements.importError, "Vui lòng kiểm tra lại thông tin và nhập số lượng là số nguyên lớn hơn 0.");
      return;
    }

    const existing = inventory.find(function (product) {
      return product.id.toLocaleLowerCase("vi") === id.toLocaleLowerCase("vi");
    });
    const updatedQuantity = (existing ? existing.quantity : 0) + quantity;
    if (!Number.isSafeInteger(updatedQuantity)) {
      showFormError(elements.importError, "Tổng số lượng tồn vượt giới hạn cho phép.");
      return;
    }

    const product = {
      id: existing ? existing.id : id,
      name: name,
      importDate: importDate,
      purchasePrice: purchasePrice,
      salePrice: salePrice,
      quantity: updatedQuantity
    };
    const nextInventory = existing
      ? inventory.map(function (item) { return item.id === existing.id ? product : item; })
      : inventory.concat(product);
    const nextActivity = activity.concat({
      type: "in",
      id: product.id,
      name: product.name,
      quantity: quantity,
      timestamp: new Date().toISOString()
    });
    if (!saveData(nextInventory, nextActivity)) return;
    inventory = nextInventory;
    activity = nextActivity;
    render();
    elements.importDialog.close();
    showNotice("Đã nhập " + numberFormat.format(quantity) + " sản phẩm " + product.name + ".");
  }

  function handleExport(event) {
    event.preventDefault();
    clearFormError(elements.exportError);
    const id = elements.exportProduct.value;
    const quantity = Number(elements.exportForm.elements.quantity.value);
    const product = inventory.find(function (item) { return item.id === id; });

    if (!product || !Number.isSafeInteger(quantity) || quantity < 1) {
      showFormError(elements.exportError, "Vui lòng chọn mặt hàng và nhập số lượng xuất là số nguyên lớn hơn 0.");
      return;
    }
    if (quantity > product.quantity) {
      showFormError(elements.exportError, "Số lượng xuất vượt tồn kho. Hiện chỉ còn " + numberFormat.format(product.quantity) + " sản phẩm.");
      return;
    }

    const nextInventory = inventory.map(function (item) {
      return item.id === id ? Object.assign({}, item, { quantity: item.quantity - quantity }) : item;
    });
    const nextActivity = activity.concat({
      type: "out",
      id: product.id,
      name: product.name,
      quantity: quantity,
      timestamp: new Date().toISOString()
    });
    if (!saveData(nextInventory, nextActivity)) return;
    inventory = nextInventory;
    activity = nextActivity;
    render();
    elements.exportDialog.close();
    showNotice("Đã xuất " + numberFormat.format(quantity) + " sản phẩm " + product.name + ".");
  }

  function render() {
    renderInventory();
    renderActivity();
  }

  document.querySelector("#import-button").addEventListener("click", openImportDialog);
  document.querySelector("#empty-import-button").addEventListener("click", openImportDialog);
  document.querySelector("#export-button").addEventListener("click", function () { openExportDialog(); });
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

  loadData();
  render();
}());
