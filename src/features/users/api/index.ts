
export {
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deactivateStudent
} from "./students.api"

export {
    getParents,
    getParent,
    createParent,
    updateParent,
    deactivateParent
} from "./parents.api"

export {
    getStudentParents,
    linkParentToStudent,
    updateStudentParentLink,
    unlinkParentFromStudent
} from "./student-parents.api"