import { Component,OnInit } from "@angular/core";
import { UserService } from "../../core/services/user.service";

@Component({
  selector: 'app-officer-dashboard',
  templateUrl: './officer.component.html',
  styleUrls: ['./officer.component.scss']
})
export class OfficerComponent implements OnInit {
  content? : string;
  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userService.getOfficerBoard().subscribe({
      next: data => {
        this.content = data;
      },
      error: err => {
        this.content = JSON.parse(err.error).message;
      }
    });
  }
}
