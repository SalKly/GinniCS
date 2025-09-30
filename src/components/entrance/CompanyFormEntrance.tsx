import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useRouter } from "next/router";
import { getCompaniesWithForms, deleteCompany, type CompanyWithForm } from "../../services/companies";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

export function CompanyFormEntrance() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [companies, setCompanies] = useState<CompanyWithForm[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recent companies on component mount
  useEffect(() => {
    loadRecentCompanies();
  }, []);

  const loadRecentCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await getCompaniesWithForms();
      setCompanies(companiesData);
    } catch (error: any) {
      console.error("Error loading companies:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load companies",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push("/form/new");
  };

  const handleEditForm = (company: CompanyWithForm) => {
    if (company.form) {
      router.push(`/form/edit/${company.name}`);
    } else {
      router.push(`/form/new?company=${encodeURIComponent(company.name)}`);
    }
  };

  const handleViewTree = (company: CompanyWithForm) => {
    if (company.form?.tree_url) {
      router.push(company.form.tree_url);
    } else if (company.form) {
      router.push(`/tree/${company.form.id}`);
    }
  };

  const handleDeleteCompany = (company: CompanyWithForm) => {
    confirmDialog({
      message: `Are you sure you want to delete "${company.name}"? This will permanently delete the company and all its form data.`,
      header: "Delete Company",
      icon: "fas fa-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          setLoading(true);
          await deleteCompany(company.id);

          // Remove company from current list
          setCompanies((prev) => prev.filter((c) => c.id !== company.id));

          toast.current?.show({
            severity: "success",
            summary: "Company Deleted",
            detail: `${company.name} has been deleted successfully.`,
            life: 3000,
          });
        } catch (error: any) {
          console.error("Error deleting company:", error);
          toast.current?.show({
            severity: "error",
            summary: "Delete Failed",
            detail: error.message || "Failed to delete company. Please try again.",
            life: 5000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const actionBodyTemplate = (company: CompanyWithForm) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="fas fa-edit"
          className="p-button-sm p-button-outlined"
          onClick={() => handleEditForm(company)}
          tooltip={company.form ? "Edit Form" : "Create Form"}
          tooltipOptions={{ position: "top" }}
        />
        {company.form && (
          <Button
            icon="fas fa-sitemap"
            className="p-button-sm p-button-outlined p-button-success"
            onClick={() => handleViewTree(company)}
            tooltip="View Tree"
            tooltipOptions={{ position: "top" }}
          />
        )}
        <Button
          icon="fas fa-trash"
          className="p-button-sm p-button-outlined p-button-danger"
          onClick={() => handleDeleteCompany(company)}
          tooltip="Delete Company"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const statusBodyTemplate = (company: CompanyWithForm) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${company.form ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
      >
        {company.form ? "Form Created" : "No Form"}
      </span>
    );
  };

  const websiteBodyTemplate = (company: CompanyWithForm) => {
    if (!company.website) return <span className="text-gray-400">—</span>;

    return (
      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-900">
        <i className="fas fa-external-link-alt mr-1"></i>
        Visit
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/GA_Logo_On-purple.png" alt="Ginni Logo" className="w-1/2 mx-auto mb-6" />
          <div className="flex items-center justify-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Form Manager</h1>
              <p className="text-gray-600">Manage your company forms and evaluation blueprints</p>
            </div>
            <Button
              icon="fas fa-plus"
              className="p-button-rounded p-button-lg"
              style={{ backgroundColor: "rgb(84, 22, 123)" }}
              onClick={handleCreateNew}
              tooltip="Add New Company"
              tooltipOptions={{ position: "left" }}
            />
          </div>
        </div>

        {/* Companies Table */}
        {companies.length > 0 ? (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-building text-purple-700"></i>
                  Your Companies
                  <span className="text-sm font-normal text-gray-500">({companies.length})</span>
                </h3>
              </div>

              <DataTable
                value={companies}
                loading={loading}
                emptyMessage="No companies found"
                paginator
                rows={10}
                className="p-datatable-sm"
                stripedRows
              >
                <Column
                  field="name"
                  header="Company Name"
                  sortable
                  style={{ minWidth: "200px" }}
                  body={(company) => <div className="font-medium text-gray-900">{company.name}</div>}
                />

                <Column field="website" header="Website" body={websiteBodyTemplate} style={{ width: "120px" }} />

                <Column header="Status" body={statusBodyTemplate} style={{ width: "120px" }} />

                <Column
                  field="updated_at"
                  header="Last Updated"
                  sortable
                  body={(company) => formatDate(company.updated_at)}
                  style={{ width: "140px" }}
                />

                <Column header="Actions" body={actionBodyTemplate} style={{ width: "150px" }} />
              </DataTable>
            </div>
          </Card>
        ) : (
          !loading && (
            <Card>
              <div className="text-center p-12">
                <div className="w-20 h-20 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-building text-purple-700 text-3xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by creating your first company form. Click the plus button above to begin.
                </p>
                <Button
                  label="Create Your First Company"
                  icon="fas fa-plus"
                  className="p-button-lg"
                  style={{ backgroundColor: "rgb(84, 22, 123)" }}
                  onClick={handleCreateNew}
                />
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
