---
services: active-directory
platforms: java
author: beth-pan
level: 300
client: Angular web app
service: Java Web API
endpoint: Microsoft identity platform
page_type: sample
languages:
  - Java
  - Typescript
products:
  - azure
  - azure-active-directory
  - java
  - office-ms-graph
description: "This sample demonstrates a Angular web app application calling a Java Web API that is secured using Azure Active Directory using the On-Behalf-Of flow"
---

# A Java Web API that calls another web API with the Microsoft identity platform using the On-Behalf-Of flow

## About this sample

### Overview

This sample demonstrates a Angular web application signing-in a user with the Microsoft Identity Platform and also obtaining an [access token](https://aka.ms/access-tokens) for the Web API. The Web API, in turn calls the [Microsoft Graph](https://graph.microsoft.com) using an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) obtained using the [on-behalf-of](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow) flow. All these are secured using the [Microsoft identity platform (formerly Azure Active Directory for developers)](https://docs.microsoft.com/azure/active-directory/develop/).

### Scenario

1. The Angular web application uses the [Microsoft Authentication Library for Angular](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) to obtain an Access token from the Microsoft identity platform for the authenticated user.
1. The access token is then used as a bearer token to authorize the caller in the Java web API and then subsequently exchanged for another access token for the Microsoft Graph API.

The flow is as follows:

1. Sign-in the user in the client(web) application.
1. Acquire an access token for the Java Web API and call it.
1. The Java Web API authorizes the caller and then calls another downstream Web API ([The Microsoft Graph](https://graph.microsoft.com)) after obtaining another [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) using the [on-behalf-of](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow) flow.

## How to run this sample

To run this sample, you'll need:

- Working installation of Java and Maven
- An Azure Active Directory (Azure AD) tenant. For more information on how to get an Azure AD tenant, see [How to get an Azure AD tenant](https://azure.microsoft.com/documentation/articles/active-directory-howto-tenant/)
- An user account in your Azure AD tenant.

### Step 1: Download Java (8 and above) for your platform

To successfully use this sample, you need a working installation of [Java](https://openjdk.java.net/install/) and [Maven](https://maven.apache.org/).

### Step 2:  Clone or download this repository

From your shell or command line:

```Shell
git clone https://github.com/Azure-Samples/ms-identity-java-webapi.git
```

### Step 3:  Register the sample with your Azure Active Directory tenant

There are two projects in this sample. Each needs to be registered separately in your Azure AD tenant. To register these projects:

#### First step: choose the Azure AD tenant where you want to create your applications

As a first step you'll need to:

1. Sign in to the [Azure portal](https://portal.azure.com) using either a work or school account or a personal Microsoft account.
1. If your account is present in more than one Azure AD tenant, select your profile at the top right corner in the menu on top of the page, and then **switch directory**.
   Change your portal session to the desired Azure AD tenant.
1. In the portal menu, select the **Azure Active Directory** service, and then select **App registrations**.

> In the next steps, you might need the tenant name (or directory name) or the tenant ID (or directory ID). These are presented in the **Properties** of the Azure Active Directory window respectively as *Name* and *Directory ID*

#### Register the Web Api app (Java-webapi)

1. Navigate to the Microsoft identity platform for developers [App registrations](https://go.microsoft.com/fwlink/?linkid=2083908) page.
1. Click **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `Java-webapi`.
   - Change **Supported account types** to **Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox, Outlook.com)**.
1. Click on the **Register** button to create the application.
1. In the app's registration **Overview** page, find the **Application (client) ID** and **Directory (tenant) ID** values and record it for use later. You'll need them to configure the configuration file(s) later in your code.
1. In the Application menu blade, click on the **Certificates & secrets** to open the page where we can generate secrets and upload certificates.
1. In the **Client secrets** section, click on **New client secret**:
   - Type a key description (for instance `app secret`),
   - Select one of the available key durations (**In 1 year**, **In 2 years**, or **Never Expires**) as per your security concerns.
   - The generated key value will be displayed when you click the **Add** button. Copy the generated value for use in the steps later.
   - You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.
1. In the Application menu blade, click on the **API permissions** to open the page where we add access to the Apis that your application needs.
   - Click the **Add a permission** button and then,
   - Ensure that the **Microsoft APIs** tab is selected.
   - In the *Commonly used Microsoft APIs* section, click on **Microsoft Graph**
   - In the **Delegated permissions** section, select the **User.Read** in the list. Use the search box if necessary. You can add more permissions to suit your app needs.
   - Click on the **Add permissions** button in the bottom.
1. In the Application menu blade, click on the **Expose an API** to open the page where declare the parameters to expose this app as an Api for which client applications can obtain [access tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) for.
The first thing that we need to do is to declare the unique [resource](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) URI that the clients will be using to obtain access tokens for this Api. To declare an resource URI, follow the following steps:
   - Click `Set` next to the **Application ID URI** to generate a URI that is unique for this app.
   - For this sample, accept the proposed Application ID URI (api://{clientId}) by selecting **Save**, and record the URI for later reference.
1. All Apis have to publish a minimum of one [scope](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code) for the client's to obtain an access token successfully. To publish a scope, follow the following steps:
   - Select **Add a scope** button open the **Add a scope** screen and Enter the values as indicated below:  
      - For **Scope name**, use `access_as_user`.
      - Select **Admins and users** options for **Who can consent?**
      - For **Admin consent display name** type `Access Java-webapi`
      - For **Admin consent description** type `Allows the app to access Java-webapi as the signed-in user.`
      - For **User consent display name** type `Access Java-webapi`
      - For **User consent description** type `Allow the application to access Java-webapi on your behalf.`
      - Keep **State** as **Enabled**
      - Click on the **Add scope** button on the bottom to save this scope.
      - Record the scope's URI (api://{clientid}/access_as_user) for later reference.

#### Configure the **msal-obo-sample** to use your Azure AD tenant

Open `application.properties` in the src/main/resources folder. Fill in with your tenant and app registration information noted in the above registration step.

- Replace *Enter_the_Tenant_Info_Here* with  **Directory (tenant) ID**.
- *Enter_the_Application_Id_here* with the **Application (client) ID**.
- *Enter_the_Client_Secret_Here* with the **key value** noted earlier.

#### Register the client web app (Angular_webapp)

1. Navigate to the Azure portal -> Azure Active Directory -> App Registrations.
1. Click **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `angular_webapp`.
   - Change **Supported account types** to **Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox, Outlook.com)**.
1. Click on the **Register** button to create the application.
1. In the app's registration **Overview** page, find the **Application (client) ID** value and record it for later. You'll need it to configure the configuration file(s) later in your code.
1. In the app's registration screen, click on the **Authentication** blade in the left and:
   - In the **Platform configurations** section select **Add a platform** and create a new **Single-page** application
   - Enter the following as the redirect URI: `http://localhost:4200`
   - Click on **Configure** to save your changes.
   - Click the **Save** button to save the the redirect URI changes.
1. In the Application menu blade, click on the **API permissions** to open the page where we add access to the Apis that your application needs.
   - Click the **Add a permission** button and then,
   - Ensure that the **My APIs** tab is selected.
   - In the list of APIs, select the API you created previously, `Java-webapi`.
   - In the **Delegated permissions** section, select the **access_as_user** in the list.
   - Click on the **Add permissions** button in the bottom.

#### Configure the **angular-web-sample** to use your Azure AD tenant

Open `auth-config.json` in the ./angular-web-sample/src/app/cd a folder. Fill in with your tenant and app registration information noted in registration step.

- Replace *clientId* with the **Application (client) ID**.
- Replace *tenantId* with the **Tenant ID** noted earlier.
- Replace *redirectUri* and *postLogoutRedirectUri* with **http://localhost:4200**
- Replace *resourceUri* with the api controller endpoints
- Replace *resourceScopes* with the API exposed in the `Web Api app` **(api://{clientId})**.

#### Configure known client applications for service (Java-webapi)

For a middle tier web API (`Java-webapi`) to be able to call a downstream web API, the middle tier app needs to be granted the required permissions as well.
However, since the middle tier cannot interact with the signed-in user, it needs to be explicitly bound to the client app in its Azure AD registration.
This binding merges the permissions required by both the client and the middle tier WebApi and and presents it to the end user in a single consent dialog. The user than then consent to this combined set of permissions.

To achieve this, you need to add the "Client ID" of the client app, in the manifest of the web API in the **knownClientApplications** property. Here's how:

In the [Azure portal](https://portal.azure.com), navigate to your `Java-webapi` app registration:

- In the Application menu blade, select **Manifest**.
- Find the attribute **knownClientApplications** and add your client application's(`Java-webapp`) **Application (client) Id** as its element.
- Click **Save**.

### Step 4: Run the applications

To run the project, you can either:

Run it directly from your IDE by using the embedded spring boot server or package it to a WAR file using [maven](https://maven.apache.org/plugins/maven-war-plugin/usage.html) and deploy it a J2EE container solution for example [Tomcat](https://tomcat.apache.org/maven-plugin-trunk/tomcat6-maven-plugin/examples/deployment.html)

#### Running the apps
Java (msal-bob-sample): `mvn spring-boot:run`
Angular (angular-web-sample): `ng serve --disable-host-check`

### You're done, run the code
Click login button and your app should show below Microsoft Graph Toolkit components:
mgt-login
mgt-person
mgt-person-card
mgt-people-picker

## About the Code

There are many key points in this sample to make the On-Behalf-Of-(OBO) flow work properly and in this section we will explain these key points for each project.

### angular-web-sample
// todo

### msal-obo-sample
1. **ApiController** class

    Contains the api(graphMeApi) to trigger the obo flow. The graphMeApi method gets the obo access token using **MsalAuthHelper**. The `callMicrosoftGraphEndPoint` method calls the Microsoft graph API using obo token.

    ```Java
    String oboAccessToken = msalAuthHelper.getOboToken("https://graph.microsoft.com/.default");

        return callMicrosoftGraphMeEndpoint(oboAccessToken);
    ```

    Important things to notice:

    - The **scope** [.default](https://docs.microsoft.com/azure/active-directory/developv2-permissions-and-consent#the-default-scope) is a built-in scope for every application that refers to the static list of permissions configured on the application registration. In our scenario here, it enables the user to grant consent for permissions for both the Web API and the downstream API (Microsoft Graph). For example, the permissions for the Web API and the downstream API (Microsoft Graph) are listed below:
             - Web Api sample (access_as_user)
             - Microsoft Graph (user.read)

    - When you use the `.default` scope, the end user is prompted for a combined set of permissions that include scopes from both the **Web Api** and **Microsoft Graph**.

2. **SecurityResourceServerConfig** class

    Token Validation of the caller happens in this class, where the access token presented by the client app is validated using Spring Security and another access token is obtained using the on-behalf-of flow

    ```Java
            http
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()
            .antMatchers("/*")
            .access("#oauth2.hasScope('" + accessAsUserScope + "')"); // required scope to access /api URL
    ```

3. **MsalAuthHelper** class

    Contains the methods to obtain the auth token and obo token to enable on-behalf-of flow.

    A code snippet showing how to obtain obo token

    ```Java
                OnBehalfOfParameters parameters =
                    OnBehalfOfParameters.builder(Collections.singleton(scope),
                            new UserAssertion(authToken))
                            .build();

            auth = application.acquireToken(parameters).join();
    ```