import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
// import { Badge } from "../../components/ui/badge";

export default function UserDetailsModal({ isOpen, onClose, user }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>User Details</ModalHeader>
        <ModalBody>
          {user ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Name
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Email
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {user.email}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Account Status
                  </h4>
                  <Badge
                    variant={
                      user.status === "active" ? "success" : "destructive"
                    }
                  >
                    {user.status || "active"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Balance
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    ${user.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              Loading user data...
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
