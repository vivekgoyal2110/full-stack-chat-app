import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { LogOut, Search, UserCircle, Bell } from "lucide-react";
import { FaRegUserCircle } from "react-icons/fa";
import debounce from "lodash/debounce";

const Navbar = () => {
    const { authUser, logout } = useAuthStore();
    const { 
        searchUsers, 
        searchResults, 
        clearSearchResults, 
        friendRequests,
        getFriendRequests,
        handleFriendRequest,
        sendFriendRequest,
        isSearching 
    } = useFriendStore();

    const [showSearch, setShowSearch] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const searchRef = useRef(null);
    const requestsRef = useRef(null);

    useEffect(() => {
        getFriendRequests();
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
                clearSearchResults();
            }
            if (requestsRef.current && !requestsRef.current.contains(event.target)) {
                setShowRequests(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [getFriendRequests, clearSearchResults]);

    const debouncedSearch = debounce((query) => {
        if (query.trim()) {
            searchUsers(query);
        } else {
            clearSearchResults();
        }
    }, 300);

    return (
        <nav className="fixed top-0 w-full bg-base-300 border-b border-base-200 py-4 px-6 z-50">
            <div className="flex items-center justify-between gap-4">
                <Link to="/" className="text-xl font-semibold">
                    ChatApp
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-xl relative" ref={searchRef}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users by email..."
                            className="w-full input input-bordered pr-10"
                            onChange={(e) => debouncedSearch(e.target.value)}
                            onFocus={() => setShowSearch(true)}
                        />
                        <Search className="absolute right-3 top-3 h-5 w-5 text-base-content/50" />
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearch && (searchResults || isSearching) && (
                        <div className="absolute w-full mt-2 bg-base-200 rounded-lg shadow-xl border border-base-300">
                            {isSearching ? (
                                <div className="p-4 text-center">
                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                    Searching...
                                </div>
                            ) : searchResults ? (
                                <div className="p-2">
                                    <div className="flex items-center gap-4 p-2 hover:bg-base-300 rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                                            {searchResults.user.profilePic ? (
                                                <img
                                                    src={searchResults.user.profilePic}
                                                    alt={searchResults.user.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FaRegUserCircle className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium">{searchResults.user.fullName}</h3>
                                            <p className="text-sm text-base-content/70">{searchResults.user.email}</p>
                                        </div>
                                        {searchResults.isFriend ? (
                                            <span className="badge badge-success">Friends</span>
                                        ) : searchResults.hasSentRequest ? (
                                            <span className="badge badge-warning">Request Sent</span>
                                        ) : searchResults.hasPendingRequest ? (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleFriendRequest(searchResults.user._id, "accept")}
                                                    className="btn btn-success btn-sm"
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleFriendRequest(searchResults.user._id, "reject")}
                                                    className="btn btn-error btn-sm"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => sendFriendRequest(searchResults.user._id)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Add Friend
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Right Side Icons */}
                <div className="flex items-center gap-4">
                    {/* Friend Requests */}
                    <div className="relative" ref={requestsRef}>
                        <button
                            className="btn btn-ghost btn-circle"
                            onClick={() => setShowRequests(!showRequests)}
                        >
                            <Bell className="h-5 w-5" />
                            {friendRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-error text-base-100 w-5 h-5 rounded-full text-xs flex items-center justify-center">
                                    {friendRequests.length}
                                </span>
                            )}
                        </button>

                        {/* Friend Requests Dropdown */}
                        {showRequests && (
                            <div className="absolute right-0 mt-2 w-80 bg-base-200 rounded-lg shadow-xl border border-base-300">
                                <div className="p-3">
                                    <h3 className="font-medium mb-2">Friend Requests</h3>
                                    <div className="divide-y divide-base-300">
                                        {friendRequests.length === 0 ? (
                                            <p className="py-4 text-center text-base-content/70">
                                                No pending requests
                                            </p>
                                        ) : (
                                            friendRequests.map((request) => (
                                                <div key={request._id} className="flex items-center gap-3 py-2">
                                                    <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                                                        {request.from.profilePic ? (
                                                            <img
                                                                src={request.from.profilePic}
                                                                alt={request.from.fullName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <FaRegUserCircle className="w-6 h-6" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {request.from.fullName}
                                                        </p>
                                                        <p className="text-sm text-base-content/70 truncate">
                                                            {request.from.email}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleFriendRequest(request._id, "accept")}
                                                            className="btn btn-success btn-xs"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleFriendRequest(request._id, "reject")}
                                                            className="btn btn-error btn-xs"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Menu */}
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full">
                                {authUser?.profilePic ? (
                                    <img src={authUser.profilePic} alt="profile" />
                                ) : (
                                    <div className="w-full h-full bg-base-300 flex items-center justify-center">
                                        <UserCircle className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        </label>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
                            <li>
                                <Link to="/profile" className="justify-between">
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <Link to="/settings">Settings</Link>
                            </li>
                            <li>
                                <button onClick={logout} className="text-error">
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;