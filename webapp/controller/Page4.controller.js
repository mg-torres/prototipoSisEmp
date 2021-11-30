sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.sistemaDeArchivos.controller.Page4", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App6197aecfc5c52d01ba7d6426";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function(oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		},
		_onIconPress: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var oQueryParams = this.getQueryParameters(window.location);

			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("default", true);
			}

		},
		getQueryParameters: function(oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		_onUploadCollectionChange: function(oEvent) {

			oEvent = jQuery.extend(true, {}, oEvent);
			return new Promise(function(fnResolve) {
					fnResolve(true);
				})
				.then(function(result) {

					var oBindingContext = oEvent.getParameter("item").getBindingContext();

					return new Promise(function(fnResolve) {
						this.doNavigate("Page3", oBindingContext, fnResolve, "");
					}.bind(this));

				}.bind(this))
				.then(function(result) {
					if (result === false) {
						return false;
					} else {

						var oUploadCollection = oEvent.getSource();
						var aFiles = oEvent.getParameter('files');

						if (aFiles && aFiles.length) {
							var oFile = aFiles[0];
							var sFileName = oFile.name;

							var oDataModel = this.getView().getModel();
							if (oUploadCollection && sFileName && oDataModel) {
								var sXsrfToken = oDataModel.getSecurityToken();
								var oCsrfParameter = new sap.m.UploadCollectionParameter({
									name: "x-csrf-token",
									value: sXsrfToken
								});
								oUploadCollection.addHeaderParameter(oCsrfParameter);
								var oContentDispositionParameter = new sap.m.UploadCollectionParameter({
									name: "content-disposition",
									value: "inline; filename=\"" + encodeURIComponent(sFileName) + "\""
								});
								oUploadCollection.addHeaderParameter(oContentDispositionParameter);
							} else {
								throw new Error("Not enough information available");
							}
						}

					}
				}.bind(this)).catch(function(err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet, sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onUploadCollectionUploadComplete: function(oEvent) {

			var oFile = oEvent.getParameter("files")[0];
			var iStatus = oFile ? oFile.status : 500;
			var sResponseRaw = oFile ? oFile.responseRaw : "";
			var oSourceBindingContext = oEvent.getSource().getBindingContext();
			var sSourceEntityId = oSourceBindingContext ? oSourceBindingContext.getProperty("") : null;
			var oModel = this.getView().getModel();

			return new Promise(function(fnResolve, fnReject) {
				if (iStatus !== 200) {
					fnReject(new Error("Upload failed"));
				} else if (oModel.hasPendingChanges()) {
					fnReject(new Error("Please save your changes, first"));
				} else if (!sSourceEntityId) {
					fnReject(new Error("No source entity key"));
				} else {
					try {
						var oResponse = JSON.parse(sResponseRaw);
						var oNewEntityInstance = {};

						oNewEntityInstance[""] = oResponse["ID"];
						oNewEntityInstance[""] = sSourceEntityId;
						oModel.createEntry("", {
							properties: oNewEntityInstance
						});
						oModel.submitChanges({
							success: function(oResponse) {
								var oChangeResponse = oResponse.__batchResponses[0].__changeResponses[0];
								if (oChangeResponse && oChangeResponse.response) {
									oModel.resetChanges();
									fnReject(new Error(oChangeResponse.message));
								} else {
									oModel.refresh();
									fnResolve();
								}
							},
							error: function(oError) {
								fnReject(new Error(oError.message));
							}
						});
					} catch (err) {
						var message = typeof err === "string" ? err : err.message;
						fnReject(new Error("Error: " + message));
					}
				}
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onUploadCollectionTypeMissmatch: function() {
			return new Promise(function(fnResolve) {
				sap.m.MessageBox.warning("The file you are trying to upload does not have an authorized file type (JPEG, JPG, GIF, PNG, TXT, PDF, XLSX, DOCX, PPTX).", {
					title: "Invalid File Type",
					onClose: function() {
						fnResolve();
					}
				});
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onUploadCollectionFileSizeExceed: function() {
			return new Promise(function(fnResolve) {
				sap.m.MessageBox.warning("The file you are trying to upload is too large (10MB max).", {
					title: "File Too Large",
					onClose: function() {
						fnResolve();
					}
				});
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		formatDateTimeUTCtoLocale: function(utcDate) {
			return utcDate ? new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds()) : null;

		},
		formatDateTimeUTCtoLocaleForStartDate: function(utcDate) {
			return utcDate ? new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours(), utcDate.getUTCMinutes(), utcDate.getUTCSeconds()) : new Date(864000000000000);

		},
		applyFiltersAndSorters: function(sControlId, sAggregationName, chartBindingInfo) {
			if (chartBindingInfo) {
				var oBindingInfo = chartBindingInfo;
			} else {
				var oBindingInfo = this.getView().byId(sControlId).getBindingInfo(sAggregationName);
			}
			var oBindingOptions = this.updateBindingOptions(sControlId);
			this.getView().byId(sControlId).bindAggregation(sAggregationName, {
				model: oBindingInfo.model,
				path: oBindingInfo.path,
				parameters: oBindingInfo.parameters,
				template: oBindingInfo.template,
				templateShareable: true,
				sorter: oBindingOptions.sorters,
				filters: oBindingOptions.filters
			});

		},
		updateBindingOptions: function(sCollectionId, oBindingData, sSourceId) {
			this.mBindingOptions = this.mBindingOptions || {};
			this.mBindingOptions[sCollectionId] = this.mBindingOptions[sCollectionId] || {};

			var aSorters = this.mBindingOptions[sCollectionId].sorters;
			var aGroupby = this.mBindingOptions[sCollectionId].groupby;

			// If there is no oBindingData parameter, we just need the processed filters and sorters from this function
			if (oBindingData) {
				if (oBindingData.sorters) {
					aSorters = oBindingData.sorters;
				}
				if (oBindingData.groupby || oBindingData.groupby === null) {
					aGroupby = oBindingData.groupby;
				}
				// 1) Update the filters map for the given collection and source
				this.mBindingOptions[sCollectionId].sorters = aSorters;
				this.mBindingOptions[sCollectionId].groupby = aGroupby;
				this.mBindingOptions[sCollectionId].filters = this.mBindingOptions[sCollectionId].filters || {};
				this.mBindingOptions[sCollectionId].filters[sSourceId] = oBindingData.filters || [];
			}

			// 2) Reapply all the filters and sorters
			var aFilters = [];
			for (var key in this.mBindingOptions[sCollectionId].filters) {
				aFilters = aFilters.concat(this.mBindingOptions[sCollectionId].filters[key]);
			}

			// Add the groupby first in the sorters array
			if (aGroupby) {
				aSorters = aSorters ? aGroupby.concat(aSorters) : aGroupby;
			}

			var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, true)] : undefined;
			return {
				filters: aFinalFilters,
				sorters: aSorters
			};

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Page4").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			var oView = this.getView(),
				oData = {},
				self = this;
			var oModel = new sap.ui.model.json.JSONModel();
			oView.setModel(oModel, "staticDataModel");
			self.oBindingParameters = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399"]["startDate"] = new Date("2018-07-01T07:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-1"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-1"]["startDate"] = new Date("2018-07-01T08:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-1"]["endDate"] = new Date("2018-07-01T10:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-2"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-2"]["startDate"] = new Date("2018-07-01T07:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-2"]["endDate"] = new Date("2018-07-01T09:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-3"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-3"]["startDate"] = new Date("2018-07-01T11:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-1-appointments-sap_ui_unified_CalendarAppointment-3"]["endDate"] = new Date("2018-07-01T13:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-1"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-1"]["startDate"] = new Date("2018-07-01T07:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-1"]["endDate"] = new Date("2018-07-01T09:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-2"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-2"]["startDate"] = new Date("2018-07-01T08:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-2"]["endDate"] = new Date("2018-07-01T10:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-3"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-3"]["startDate"] = new Date("2018-07-01T12:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-2-appointments-sap_ui_unified_CalendarAppointment-3"]["endDate"] = new Date("2018-07-01T14:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-3-appointments-sap_ui_unified_CalendarAppointment-1"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-3-appointments-sap_ui_unified_CalendarAppointment-1"]["startDate"] = new Date("2018-07-01T08:30:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-3-appointments-sap_ui_unified_CalendarAppointment-1"]["endDate"] = new Date("2018-07-01T11:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-3-appointments-sap_ui_unified_CalendarAppointment-1637706849297"] = {};

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-3-appointments-sap_ui_unified_CalendarAppointment-1637706849297"]["startDate"] = new Date("2018-07-01T07:00:00.000Z");

			oData["sap_Responsive_Page_0-content-sap_ui_layout_BlockLayout-1637674623811-content-sap_ui_layout_BlockLayoutRow-1-content-sap_ui_layout_BlockLayoutCell-1-content-sap_m_PlanningCalendar-1637675537399-rows-sap_m_PlanningCalendarRow-3-appointments-sap_ui_unified_CalendarAppointment-1637706849297"]["endDate"] = new Date("2018-07-01T09:30:00.000Z");

			oView.getModel("staticDataModel").setData(oData, true);

			function dateDimensionFormatter(oDimensionValue, sTextValue) {
				var oValueToFormat = sTextValue !== undefined ? sTextValue : oDimensionValue;
				if (oValueToFormat instanceof Date) {
					var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
						style: "short"
					});
					return oFormat.format(oValueToFormat);
				}
				return oValueToFormat;
			}

		},
		onAfterRendering: function() {

			var oChart,
				self = this,
				oBindingParameters = this.oBindingParameters,
				oView = this.getView();

		}
	});
}, /* bExport= */ true);
