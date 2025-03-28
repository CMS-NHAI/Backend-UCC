export const userRoleResourcePermissionBasedAccess = (userRoles, userResource, userPermission) => {
    return async (req, res, next) => {
        try {
 
            console.log("userRoles ====>>>", userRoles)
            console.log("userResource ====>>>", userResource)
            console.log("userPermission ====>>>", userPermission)
 
            // Validate the incoming parameters
            if (!Array.isArray(userRoles) || userRoles.length === 0) {
                return res.status(400).json({ message: "Invalid roles. Please provide an array of roles." });
            }
            if (!Array.isArray(userResource) || userResource.length === 0) {
                return res.status(400).json({ message: "Invalid resources. Please provide an array of resources." });
            }
            if (!Array.isArray(userPermission) || userPermission.length === 0) {
                return res.status(400).json({ message: "Invalid permissions. Please provide an array of permissions." });
            }
 
            // Retrieve Keycloak token
            const token = await keycloakAccessToken();
 
            if (!token) {
                return res.status(400).json({ message: "Token is missing or invalid" });
            }
 
            const mobileNumber = req.user?.phone_number;
            const userEmail = req.user?.email;
 
            if (!mobileNumber && !userEmail) {
                return res.status(400).json({ message: "Mobile number or email is required" });
            }
 
            // Fetch user by email or mobile
            const user = await getUserByEmailOrMobile(userEmail, mobileNumber, token);
            console.log("user ====>>>>>>", user)
 
            if (!user) {
                return res.status(404).json({ message: "No user found with the given mobile number or email." });
            }
 
            // Fetch user details for role, resource, and permission validation
            const userDetail = await getKeycloakUserPermission({ mobileNumber: mobileNumber });
            console.log("userDetail ======>>>>>", userDetail)
 
            if (!userDetail) {
                return res.status(404).json({ message: "User details not found in the system." });
            }
 
            // Validate roles
            const hasUserRoles = userRoles.some(role => userDetail?.userRole.includes(role));
            console.log("hasUserRoles ======>>>>>", hasUserRoles)
            if (!hasUserRoles) {
                return res.status(403).json({ message: "Forbidden: Insufficient roles" });
            }
 
            // Validate resources
            const matchedResource = userDetail?.userAuthorization?.filter(auth => userResource.includes(auth.resource));
            console.log("matchedResource ======>>>>>", matchedResource)
           
            if (!matchedResource || matchedResource.length === 0) {
                return res.status(403).json({ message: "Forbidden: No matching resources found" });
            }
 
            // Validate permissions
            const hasPermission = matchedResource.some(auth =>
                auth.scope.some(scope => userPermission.includes(scope))
            );
            console.log("hasPermission ======>>>>>", hasPermission)
            if (!hasPermission) {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }
 
            // Proceed to the next middleware/controller if validation is successful
            next();
        } catch (error) {
            console.error(error);  // Log the error for debugging
            return res.status(500).json({ message: error.message || "An unexpected error occurred." });
        }
    };
};